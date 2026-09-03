from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
import io
import asyncio

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
    """
    Ingests multiple files, reads ONLY the first 5 rows of each, 
    and asks the AI to map the schemas and assess readiness.
    """
    file_samples_dict = {}

    for uploaded_file in files:
        # Read the raw bytes
        contents = await uploaded_file.read()
        
        try:
            # Read only the first 5 rows
            df_sample = pd.read_csv(io.BytesIO(contents), nrows=5)
            sample_csv_string = df_sample.to_csv(index=False)
            file_samples_dict[uploaded_file.filename] = sample_csv_string
        except Exception as e:
            return {"status": "error", "message": f"Could not read {uploaded_file.filename}: {str(e)}"}
        finally:
            await uploaded_file.seek(0)

    try:
        mapping_result = await asyncio.to_thread(run_schema_mapper, file_samples_dict)
        return {
            "status": "success",
            "data": mapping_result.model_dump()
        }
    except Exception as e:
        return {"status": "error", "message": f"AI Mapping failed: {str(e)}"}

@app.post("/api/v1/reconcile")
def trigger_reconciliation():
    """Triggers the FinRecon pipeline and returns the metrics."""
    result = run_pipeline()
    return result