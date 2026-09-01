from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field
from typing import Literal, List, Optional

load_dotenv()

client = genai.Client()

class SingleReconciliation(BaseModel):
    decision: Literal["MATCH", "UNRESOLVED"] = Field(
        description="Choose MATCH if the evidence strongly suggests these represent the same underlying money movement. Otherwise, UNRESOLVED."
    )
    confidence_score: int = Field(
        description="Confidence level from 0 to 100"
    )
    reasoning: str = Field(
        description="A one or two sentence explanation of why this decision was made based on the provided evidence."
    )

class MatchedPair(BaseModel):
    order_id: str = Field(description="The order_id from the Target Expected Settlement.")
    bank_date: str = Field(description="The value_date of the matched candidate bank credit.")
    bank_credit: float = Field(description="The amount of the matched bank credit.")
    confidence_score: int = Field(description="Confidence level from 0 to 100")
    reasoning: str = Field(description="Why these two records were mapped together.")

class BatchReconciliationResult(BaseModel):
    resolved_matches: List[MatchedPair] = Field(description="List of successfully matched pairs.")
    unresolved_orders: List[str] = Field(description="List of order_ids that could not be confidently matched.")

def _resolve_single(target_record, candidate_record):
    """Single Matching. Tries to resolve the provided target with the provided candidate and returns a confidence score"""
    prompt = f"""
    I have a financial reconciliation exception. Deterministic matching failed.
    
    Target Expected Settlement:
    - Order ID: {target_record['order_id']}
    - Expected Net Amount: {target_record['net_amt']}
    - Settled At: {target_record['settled_at']}
    
    Candidate Bank Credit:
    - Bank Date: {candidate_record['value_date']}
    - Credit Amount: {candidate_record['credit']}
    - Narration: {candidate_record['narration']}
    
    Based on this evidence, do these records represent the same transaction?
    """

    print("\n[RECONCILIATION/AI_RESOLVER] Asking AI Resolver")
    

    interaction = client.interactions.create(
        model="gemini-3.6-flash",
        input=prompt,
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": SingleReconciliation.model_json_schema()
        },
    )

    print("\n[RECONCILIATION/AI_RESOLVER] AI Resolver Reponse:")
    print(interaction.output_text)
    decision = SingleReconciliation.model_validate_json(interaction.output_text)

    return decision

def _resolve_batch(unmatched_df, unmatched_bank):
    """Batch processing. Tries to resolve the unmatched records and provides a list of matched as well as unmatched records"""
    
    orders_csv = unmatched_df[['order_id', 'order_date', 'net_amt']].to_csv(index=False)
    bank_csv = unmatched_bank[['value_date', 'narration', 'credit']].to_csv(index=False)
    
    prompt = f"""
    You are an AI Finance Controller. Deterministic matching has cleared the easy records. 
    Below are the remaining unmatched expected settlements and unmatched bank credits.
    
    UNMATCHED EXPECTED SETTLEMENTS:
    {orders_csv}
    
    UNMATCHED BANK CREDITS:
    {bank_csv}
    
    Task: Reconcile these lists. Map the expected settlements to the bank credits based on exact amounts and chronological validity (bank date >= order date).
    """
    
    print("\n[RECONCILIATION/AI_RESOLVER] Asking AI Resolver (Batch Mode)...")
    
    interaction = client.interactions.create(
        model="gemini-3.6-flash",
        input=prompt,
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": BatchReconciliationResult.model_json_schema()
        },
    )

    print("\n[RECONCILIATION/AI_RESOLVER] AI Resolver Reponse:")
    # print(interaction.output_text)
    decision = BatchReconciliationResult.model_validate_json(interaction.output_text)

    return decision

def run_ai_resolver(unmatched_df, unmatched_bank, mode="batch"):
    """Router function to handle different AI resolution strategies."""
    if mode == "batch":
        return _resolve_batch(unmatched_df, unmatched_bank)
    elif mode == "single":
        return _resolve_single(unmatched_df.iloc[0], unmatched_bank.iloc[0])
    else:
        raise ValueError(f"Unknown mode: {mode}")