import pandas as pd

class RuleMatcher:
    def __init__(self, target_df: pd.DataFrame, bank_df: pd.DataFrame):
        self.df = target_df.copy()
        self.bank = bank_df.copy()
        self.matched_bank_indices = set()

    def _get_substrings(self, text):
        """Helper to get reference and stripped reference."""
        full_ref = str(text)
        stripped = full_ref.split("_")[-1] if "_" in full_ref else full_ref
        return full_ref, stripped

    def apply_amount_and_reference_rules(self):
        """Applies exact amount, time window, and fuzzy reference rules."""
        for bank_idx, bank_row in self.bank.iterrows():
            candidates = self.df[
                (self.df["net_amt"] == bank_row["credit"]) & 
                (self.df["match_status"] == "UNMATCHED")
            ]
            
            candidates = candidates[candidates["order_date"] <= bank_row["value_date"]]

            if candidates.empty:
                continue
                
            for _, candidate_row in candidates.iterrows():
                full_ref, stripped_ref = self._get_substrings(candidate_row["txn_ref"])
                
                if full_ref in str(bank_row["narration"]) or stripped_ref in str(bank_row["narration"]):
                    order_id = candidate_row["order_id"]
                    
                    self.df.loc[self.df["order_id"] == order_id, "match_status"] = "EXACT_MATCH"
                    self.df.loc[self.df["order_id"] == order_id, "bank_date"] = bank_row["value_date"]
                    self.df.loc[self.df["order_id"] == order_id, "bank_narration"] = bank_row["narration"]
                    
                    self.matched_bank_indices.add(bank_idx)
                    break 

        return self.df, self.matched_bank_indices