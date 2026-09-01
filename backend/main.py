from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from engine import run_pipeline

app = FastAPI(title="FinRecon API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/reconcile")
def trigger_reconciliation():
    """Triggers the FinRecon pipeline and returns the metrics."""
    result = run_pipeline()
    return result