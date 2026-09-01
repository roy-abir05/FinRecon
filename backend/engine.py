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

if __name__=="__main__":
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
        print("\n[ENGINE] Sending Exceptions to AI Resolver")
        
        for _, target_row in unmatched_df.iterrows():
            for bank_idx, candidate_row in unmatched_bank.iterrows():
                
                if bank_idx in matched_bank_indices:
                    continue
                
                decision = run_ai_resolver(target_row, candidate_row)
                
                if decision.decision == "MATCH":
                    print(f"  -> AI Matched Order {target_row['order_id']} to Bank Credit {candidate_row['credit']}!")
                    ai_resolved_count += 1
                    matched_bank_indices.add(bank_idx)
                    break
                    
    else:
        print("\n[ENGINE] All records matched deterministically.")

    total_records = len(df)
    deterministic_matches = total_records - len(unmatched_df)
    
    print("\n--- FinRecon Final Metrics ---")
    print(f"Total Records: {total_records}")
    print(f"Deterministic Matches: {deterministic_matches} ({round(deterministic_matches/total_records*100, 1)}%)")
    print(f"AI-Resolved Matches: {ai_resolved_count} ({round(ai_resolved_count/total_records*100, 1)}%)")
    
    total_matches = deterministic_matches + ai_resolved_count
    print(f"Overall Match Rate: {round(total_matches/total_records*100, 1)}%")
    print(f"Exceptions Escalate to Human: {len(unmatched_df) - ai_resolved_count}")