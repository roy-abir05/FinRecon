from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import Literal, List
from google import genai
from pydantic import BaseModel, Field

load_dotenv()

CanonicalColumns = Literal[
    # Orders
    "order_id", "order_date", "amount",
    # Gateway
    "txn_ref", "linked_order", "settled_at", "gross_amt", "fee", "net_amt",
    # Bank
    "value_date", "narration", "credit",
    # Ignore this column
    "ignore"
]

FileType = Literal["ORDERS", "GATEWAY", "BANK", "UNKNOWN"]

class ColumnMapping(BaseModel):
    source_column: str = Field(description="The exact name of the column in the uploaded CSV.")
    canonical_column: CanonicalColumns = Field(description="The FinRecon standard column this maps to. Use 'ignore' if it's irrelevant.")
    confidence: int = Field(description="Confidence score from 0 to 100 that this mapping is correct.")

class FileClassification(BaseModel):
    filename: str = Field(description="The name of the uploaded file.")
    file_type: FileType = Field(description="What domain this file belongs to.")
    mappings: List[ColumnMapping] = Field(description="Column mappings for this specific file.")
    reasoning: str = Field(description="Brief explanation of why this file was classified this way.")

class SchemaMapperResult(BaseModel):
    files: List[FileClassification] = Field(description="List of classified and mapped files.")
    readiness_score: int = Field(description="Overall confidence (0-100) that the pipeline has the required data to run.")
    warnings: List[str] = Field(
        description="Any issues found. E.g., 'Missing Orders file', 'Multiple Bank files detected (will be merged)', 'Missing fee column'."
    )

client = genai.Client()

def run_schema_mapper(file_samples_dict: dict) -> SchemaMapperResult:
    """
    Takes a dictionary of { "filename": "csv_header_and_5_rows_string" }
    and asks the LLM to map them to the canonical schema.
    """
    
    # Convert the dict to a clean string for the prompt
    samples_text = ""
    for filename, sample_csv in file_samples_dict.items():
        samples_text += f"\n--- FILE: {filename} ---\n{sample_csv}\n"

    prompt = f"""
    You are an AI Data Architect for a financial reconciliation system.
    The user has uploaded {len(file_samples_dict)} file(s). 
    
    Here are the file names, headers, and top 5 rows of each file:
    {samples_text}
    
    SYSTEM REQUIREMENTS:
    A complete 3-way reconciliation requires:
    1. ORDERS: The internal business truth (order_id, order_date, amount).
    2. GATEWAY: The payment processor (txn_ref, linked_order, settled_at, net_amt).
    3. BANK: The cash reality (value_date, narration, credit).
    
    YOUR TASK:
    1. Identify the 'file_type' for each file. If multiple files are the same type (e.g., two Bank files), classify them both as BANK.
    2. Map the uploaded column names to our CanonicalColumns. If a column is irrelevant (like 'Customer_IP' or 'Row_Number'), map it to 'ignore'.
    3. Evaluate the 'readiness_score' (0-100). If a critical file type (like BANK or GATEWAY) is entirely missing, the score must be below 50.
    4. Provide specific 'warnings' if files are missing, if required columns are missing, or if multiple files of the same type need to be merged.
    """

    print("\n[PRE-PROCESSING] Asking AI Schema Mapper to evaluate files...")
    
    interaction = client.interactions.create(
        model="gemini-3.6-flash",
        input=prompt,
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": SchemaMapperResult.model_json_schema()
        },
    )

    print("\n[PRE-PROCESSING] AI Output")
    print(interaction.output_text)
    
    result = SchemaMapperResult.model_validate_json(interaction.output_text)
    return result