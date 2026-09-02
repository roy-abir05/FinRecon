"use client";
import { useState } from "react";
import {
  Play,
  Loader2,
  CheckCircle2,
  Zap,
  AlertCircle,
  Database,
  ArrowRight,
  UploadCloud,
} from "lucide-react";

export default function Dashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [schemaData, setSchemaData] = useState<any>(null);

  const runPipeline = async () => {
    setIsRunning(true);
    try {
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();

    Array.from(e.target.files).forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/map-schema", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setSchemaData(data);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-8 border-b border-[#1a1a1a] pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Reconciliation Run
          </h1>
          <p className="text-sm text-[#8B96A8] mt-1">
            Batch orchestration and pipeline telemetry.
          </p>
        </div>
        <button
          onClick={runPipeline}
          disabled={isRunning}
          className="flex items-center gap-2 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#00E5FF]/20 disabled:opacity-50 transition-all shadow-sm"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isRunning ? "Executing Batch..." : "Trigger Engine"}
        </button>
      </header>

      {!metrics && !schemaData && (
        <div className="border border-dashed border-[#222B3A] bg-[#0A0A0A] hover:bg-[#111111] transition-colors rounded-xl h-64 flex flex-col items-center justify-center text-[#8B96A8] text-sm relative group">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            accept=".csv"
          />
          {isUploading ? (
            <Loader2 className="w-8 h-8 mb-3 text-[#00E5FF] animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8 mb-3 text-[#333333] group-hover:text-[#00E5FF] transition-colors" />
          )}
          <p className="font-mono text-white">
            {isUploading ? "READING_BUFFERS..." : "DROP_CSV_FILES_HERE"}
          </p>
          <p className="text-xs mt-2 text-[#555555]">
            Click or drag Orders, Gateway, and Bank files to begin Schema
            Inference.
          </p>
        </div>
      )}

      {/* Temporary view to prove the backend parsed the CSVs correctly */}
      {schemaData && !metrics && (
        <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider flex items-center justify-between">
            Backend Dry Run Payload
            <span className="text-xs font-mono text-[#00E5FF]">
              STATUS: 200 OK
            </span>
          </h3>
          <div className="bg-[#050505] border border-[#1a1a1a] p-4 rounded-md overflow-x-auto">
            <pre className="text-xs font-mono text-[#8B96A8] whitespace-pre-wrap">
              {JSON.stringify(schemaData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {metrics && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              title="Ingested Records"
              value={metrics.total_records}
              icon={Database}
            />
            <KpiCard
              title="Overall Match Rate"
              value={`${metrics.match_rate_percentage}%`}
              icon={CheckCircle2}
              highlight="text-[#22C55E]"
            />
            <KpiCard
              title="Deterministic Rules"
              value={metrics.deterministic_matches}
              icon={Zap}
              highlight="text-[#35D6FF]"
            />
            <KpiCard
              title="Pending Exceptions"
              value={metrics.exceptions_escalated}
              icon={AlertCircle}
              highlight={
                metrics.exceptions_escalated > 0
                  ? "text-[#F5B83D]"
                  : "text-[#8B96A8]"
              }
            />
          </div>

          <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider flex items-center justify-between">
              Resolution Pipeline
              <span className="text-xs font-mono text-[#8B96A8] font-normal">
                LATENCY: ~1.2s
              </span>
            </h3>

            <div className="space-y-4">
              <FunnelBar
                label="Initial Volume"
                value={metrics.total_records}
                percentage={100}
                color="bg-[#111111]"
                barColor="bg-[#333333]"
              />
              <div className="flex justify-center">
                <ArrowRight className="w-4 h-4 text-[#333333] rotate-90" />
              </div>

              <FunnelBar
                label="Rule-Based (Exact)"
                value={metrics.deterministic_matches}
                percentage={
                  (metrics.deterministic_matches / metrics.total_records) * 100
                }
                color="bg-[#111111]"
                barColor="bg-[#35D6FF]"
              />
              <div className="flex justify-center">
                <ArrowRight className="w-4 h-4 text-[#333333] rotate-90" />
              </div>

              <FunnelBar
                label="AI Resolver (Residual)"
                value={metrics.ai_resolved_matches}
                percentage={
                  (metrics.ai_resolved_matches / metrics.total_records) * 100
                }
                color="bg-[#111111]"
                barColor="bg-[#9B7BFF]"
              />
              <div className="flex justify-center">
                <ArrowRight className="w-4 h-4 text-[#333333] rotate-90" />
              </div>

              <FunnelBar
                label="Unresolved Exceptions"
                value={metrics.exceptions_escalated}
                percentage={
                  metrics.total_records === 0
                    ? 0
                    : (metrics.exceptions_escalated / metrics.total_records) *
                        100 || 2
                }
                color="bg-[#111111]"
                barColor="bg-[#F05252]"
                isException
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  highlight = "text-white",
}: {
  title: string;
  value: string | number;
  icon: any;
  highlight?: string;
}) {
  return (
    <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#8B96A8]">{title}</h3>
        <Icon className="w-4 h-4 text-[#444444]" />
      </div>
      <div className={`text-3xl font-mono tracking-tight ${highlight}`}>
        {value}
      </div>
    </div>
  );
}

function FunnelBar({
  label,
  value,
  percentage,
  color,
  barColor = "bg-gray-200",
  isException = false,
}: {
  label: string;
  value: number;
  percentage: number;
  color: string;
  barColor?: string;
  isException?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${color} border border-[#1a1a1a]`}
    >
      <div className="flex-1">
        <span
          className={`text-sm font-medium ${isException && value > 0 ? "text-[#F05252]" : "text-[#E8EDF5]"}`}
        >
          {label}
        </span>
      </div>
      <div className="flex-1 flex justify-center">
        <div className="w-full bg-[#222B3A] rounded-full h-1.5 max-w-xs overflow-hidden">
          <div
            className={`h-1.5 rounded-full ${barColor}`}
            style={{ width: `${Math.max(percentage, 1)}%` }}
          ></div>
        </div>
      </div>
      <div className="flex-1 flex justify-end">
        <span className="text-sm font-mono text-[#8B96A8]">
          {value} records
        </span>
      </div>
    </div>
  );
}
