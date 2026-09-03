from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import pandas as pd
import asyncio
import os
import uuid
import shutil

from engine import run_pipeline
from reconciliation.schema_mapper import run_schema_mapper

from pydantic import BaseModel

class ReconcileRequest(BaseModel):
    batch_id: str
    approved_schema: Dict[str, Any]

app = FastAPI(title="FinRecon API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/map-schema")
async def map_schema(files: List[UploadFile] = File(...)):
    """Ingests files, saves them temporarily, and maps schema via AI."""
    
    batch_id = str(uuid.uuid4())
    staging_dir = os.path.join("temp_uploads", batch_id)
    os.makedirs(staging_dir, exist_ok=True)
    
    file_samples_dict = {}

    for uploaded_file in files:
        file_path = os.path.join(staging_dir, uploaded_file.filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(uploaded_file.file, buffer)
            
        try:
            df_sample = pd.read_csv(file_path, nrows=5)
            sample_csv_string = df_sample.to_csv(index=False)
            file_samples_dict[uploaded_file.filename] = sample_csv_string
        except Exception as e:
            return {"status": "error", "message": f"Could not read {uploaded_file.filename}: {str(e)}"}

    try:
        mapping_result = await asyncio.to_thread(run_schema_mapper, file_samples_dict)

        return {
            "status": "success",
            "batch_id": batch_id,
            "data": mapping_result.model_dump()
        }
    except Exception as e:
        return {"status": "error", "message": f"AI Mapping failed: {str(e)}"}

@app.post("/api/v1/reconcile")
def trigger_reconciliation(payload: ReconcileRequest):
    """Loads staged files, applies human-approved schema, and runs the engine."""
    batch_dir = os.path.join("temp_uploads", payload.batch_id)
    
    if not os.path.exists(batch_dir):
        return {"status": "error", "message": "Batch ID not found or expired."}

    parsed_dfs = {"ORDERS": [], "GATEWAY": [], "BANK": []}

    try:
        for file_info in payload.approved_schema.get("files", []):
            file_path = os.path.join(batch_dir, file_info["filename"])
            
            if not os.path.exists(file_path):
                continue
            
            df = pd.read_csv(file_path)
            
            columns_to_drop = []
            rename_mapping = {}
            
            for mapping in file_info.get("mappings", []):
                source_col = mapping["source_column"]
                canonical_col = mapping["canonical_column"]
                
                if canonical_col == "ignore":
                    columns_to_drop.append(source_col)
                else:
                    rename_mapping[source_col] = canonical_col
            
            existing_drop_cols = [c for c in columns_to_drop if c in df.columns]
            if existing_drop_cols:
                df = df.drop(columns=existing_drop_cols)
                
            df = df.rename(columns=rename_mapping)
            
            file_type = file_info.get("file_type")
            if file_type in parsed_dfs:
                parsed_dfs[file_type].append(df)

        if not parsed_dfs["ORDERS"] or not parsed_dfs["GATEWAY"] or not parsed_dfs["BANK"]:
            return {"status": "error", "message": "Missing required normalized datasets (Orders, Gateway, or Bank)."}

        orders_df = pd.concat(parsed_dfs["ORDERS"], ignore_index=True)
        gateway_df = pd.concat(parsed_dfs["GATEWAY"], ignore_index=True)
        bank_df = pd.concat(parsed_dfs["BANK"], ignore_index=True)

        result = run_pipeline(orders_df, gateway_df, bank_df)
        
        return result
        
    except Exception as e:
        return {"status": "error", "message": f"Reconciliation pipeline failed: {str(e)}"}
        
    finally:
        # Cleanup
        if os.path.exists(batch_dir):
            shutil.rmtree(batch_dir)