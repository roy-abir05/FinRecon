"use client";
import { useState } from "react";
import { Play, Loader2 } from "lucide-react";

export default function Dashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  const runPipeline = async () => {
    setIsRunning(true);
    try {
      // Calls your local FastAPI backend
      const response = await fetch("http://127.0.0.1:8000/api/v1/reconcile", {
        method: "POST",
      });
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error("Failed to run pipeline:", error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            System Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time pipeline telemetry and match rates.
          </p>
        </div>
        <button
          onClick={runPipeline}
          disabled={isRunning}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isRunning ? "Engine Running..." : "Run Reconciliation Batch"}
        </button>
      </header>

      {/* Temporary Debug Viewer */}
      {metrics && (
        <div className="bg-gray-900 rounded-lg p-6 font-mono text-sm overflow-x-auto text-green-400">
          <h3 className="text-gray-400 mb-4 uppercase text-xs tracking-wider">
            FastAPI Response Payload
          </h3>
          <pre>{JSON.stringify(metrics, null, 2)}</pre>
        </div>
      )}

      {!metrics && !isRunning && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg h-64 flex items-center justify-center text-gray-500 text-sm">
          Awaiting pipeline execution. Click "Run Reconciliation Batch" to
          process records.
        </div>
      )}
    </div>
  );
}
