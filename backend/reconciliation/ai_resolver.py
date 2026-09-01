from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field
from typing import Literal

load_dotenv()

client = genai.Client()

class AIReconciliationDecision(BaseModel):
    decision: Literal["MATCH", "UNRESOLVED"] = Field(
        description="Choose MATCH if the evidence strongly suggests these represent the same underlying money movement. Otherwise, UNRESOLVED."
    )
    confidence_score: int = Field(
        description="Confidence level from 0 to 100"
    )
    reasoning: str = Field(
        description="A one or two sentence explanation of why this decision was made based on the provided evidence."
    )

def run_ai_resolver(target_record, candidate_record):

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
            "schema": AIReconciliationDecision.model_json_schema()
        },
    )

    print("\n[RECONCILIATION/AI_RESOLVER] AI Resolver Reponse:")
    print(interaction.output_text)
    decision = AIReconciliationDecision.model_validate_json(interaction.output_text)

    return decision