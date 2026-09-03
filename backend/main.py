from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
import io
import asyncio
import os
import uuid
import shutil

from engine import run_pipeline
from reconciliation.schema_mapper import run_schema_mapper

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
def trigger_reconciliation():
    """Triggers the FinRecon pipeline and returns the metrics."""
    result = run_pipeline()
    return result