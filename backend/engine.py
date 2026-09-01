import pandas as pd
from reconciliation.rules import RuleMatcher
from reconciliation.ai_resolver import run_ai_resolver

def load_and_prepare_data():
    orders = pd.read_csv("./data/orders.csv")
    gateway = pd.read_csv("./data/gateway.csv")
    bank = pd.read_csv("./data/bank.csv")

    orders["order_date"] = pd.to_datetime(orders["order_date"])
    gateway["settled_at"] = pd.to_datetime(gateway["settled_at"])
    bank["value_date"] = pd.to_datetime(bank["value_date"])

    df = orders.join(gateway.set_index("linked_order"), on="order_id")
    df.insert(len(df.columns), "match_status", "UNMATCHED")
    df.insert(len(df.columns), "bank_date", None)
    df.insert(len(df.columns), "bank_narration", None)

    return df, bank

def run_pipeline():
    print("[ENGINE] Starting FinRecon Pipeline")

    df, bank = load_and_prepare_data()
    
    print("[ENGINE] Running RuleMatcher...")
    matcher = RuleMatcher(df, bank)
    processed_df, matched_bank_indices = matcher.apply_amount_and_reference_rules()
    print("[ENGINE] Rule matching complete")

    print("[ENGINE] processed_df:")
    print(processed_df)

    unmatched_df = processed_df[processed_df["match_status"] == "UNMATCHED"]
    unmatched_bank = bank.drop(bank.index[list(matched_bank_indices)])

    print("\n[ENGINE] unmatched_df:")
    print(unmatched_df)
    print("\n[ENGINE] unmatched_bank:")
    print(unmatched_bank)

    ai_resolved_count = 0
    
    if not unmatched_df.empty and not unmatched_bank.empty:
        print("\n[ENGINE] Sending Exceptions to AI Resolver (Batch Mode)...")
        decision = run_ai_resolver(unmatched_df, unmatched_bank, mode="batch")
        
        print("\n[ENGINE] AI Batch Resolution Results:")
        for match in decision.resolved_matches:
            print(f"  ✅ Matched Order {match.order_id} to Bank Credit ₹{match.bank_credit}")
            print(f"     Reasoning: {match.reasoning}")
            ai_resolved_count += 1
            
            processed_df.loc[processed_df["order_id"] == match.order_id, "match_status"] = "AI_MATCH"
            processed_df.loc[processed_df["order_id"] == match.order_id, "bank_date"] = pd.to_datetime(match.bank_date)
            processed_df.loc[processed_df["order_id"] == match.order_id, "bank_narration"] = "AI_RESOLVED: " + match.reasoning
            
            matched_bank_row = unmatched_bank[
                (unmatched_bank["credit"] == match.bank_credit) & 
                (unmatched_bank["value_date"].astype(str).str.contains(match.bank_date[:10]))
            ]
            
            if not matched_bank_row.empty:
                bank_idx = matched_bank_row.index[0]
                matched_bank_indices.add(bank_idx)
                unmatched_bank = unmatched_bank.drop(bank_idx)
            
        if decision.unresolved_orders:
            print("\n[ENGINE] Orders still unresolved (Escalated to Human):")
            for order in decision.unresolved_orders:
                print(f"  ⚠️ {order}")
                    
    else:
        print("\n[ENGINE] All records matched deterministically.")

    total_records = len(df)
    deterministic_matches = total_records - len(unmatched_df)
    total_matches = deterministic_matches + ai_resolved_count
    
    return {
        "status": "success",
        "metrics": {
            "total_records": total_records,
            "deterministic_matches": deterministic_matches,
            "ai_resolved_matches": ai_resolved_count,
            "match_rate_percentage": round(total_matches / total_records * 100, 1),
            "exceptions_escalated": len(unmatched_df) - ai_resolved_count
        }
    }

if __name__=="__main__":
    run_pipeline()