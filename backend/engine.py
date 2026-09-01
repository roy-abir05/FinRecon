import pandas as pd
from reconciliation import run_ai_resolver

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

def get_all_substrings(text):
    n = len(text)
    for i in range(n):
        for j in range(i + 1, n + 1):
            yield text[i:j]

matched_bank_indices = set()

for bank_idx, bank_row in bank.iterrows():
    filtered_df = df[(df["net_amt"] == bank_row["credit"]) & (df["match_status"] == "UNMATCHED")]
    filtered_df = filtered_df[filtered_df["order_date"]<=bank_row["value_date"]]

    if filtered_df.size == 0:
        continue
    for fdf_idx, fdf_row in filtered_df.iterrows():
        full_ref = str(fdf_row["txn_ref"])
        stripped_ref = full_ref.split("_")[-1] if "_" in full_ref else full_ref
        if full_ref in str(bank_row["narration"]) or stripped_ref in str(bank_row["narration"]):

            current_order_id = fdf_row["order_id"]
            df.loc[df["order_id"] == current_order_id, "match_status"] = "EXACT_MATCH"
            df.loc[df["order_id"] == current_order_id, "bank_date"] = bank_row["value_date"]
            df.loc[df["order_id"] == current_order_id, "bank_narration"] = bank_row["narration"]

            matched_bank_indices.add(bank_idx)
            break

unmatched_df = df[df["match_status"]=="UNMATCHED"]
unmatched_bank = bank.drop(bank.index[list(matched_bank_indices)])

if not unmatched_df.empty and not unmatched_bank.empty:
    print("\n--- Sending Exceptions to AI Resolver ---")
    run_ai_resolver(unmatched_df, unmatched_bank)
else:
    print("\n--- No exceptions to resolve! All records matched deterministically. ---")