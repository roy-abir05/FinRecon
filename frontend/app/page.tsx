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
  FileText,
  Check,
} from "lucide-react";
import { KpiCard } from "./components/KpiCard";
import { FunnelBar } from "./components/FunnelBar";
import { GlowingDropzone } from "./components/GlowingDropzone";
import { SchemaEditor } from "./components/SchemaEditor";
import { TerminalLogger } from "./components/TerminalLogger";
import { useRecon } from "./context/ReconContext";

export default function Dashboard() {
  const [isUploading, setIsUploading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [schemaData, setSchemaData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [rawFiles, setRawFiles] = useState<FileList | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const { reconData, setReconData } = useRecon();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setRawFiles(e.target.files);
    setIsUploading(true);

    const formData = new FormData();
    Array.from(e.target.files).forEach((file) =>
      formData.append("files", file),
    );

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/map-schema", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setSchemaData(data.data);
      setBatchId(data.batch_id);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMappingChange = (
    fileIndex: number,
    mappingIndex: number,
    newColumn: string,
  ) => {
    setSchemaData((prev: any) => {
      const newData = { ...prev };
      newData.files[fileIndex].mappings[mappingIndex].canonical_column =
        newColumn;
      return newData;
    });
  };

  const confirmAndReconcile = async () => {
    if (!batchId || !schemaData) return;

    setIsRunning(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/reconcile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batch_id: batchId,
          approved_schema: schemaData,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        setMetrics(data.metrics);
        setReconData({
          metrics: data.metrics,
          data: data.data
        });
      } else {
        console.error("Backend Error:", data.message);
      }
    } catch (error) {
      console.error("Reconciliation failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24">
      <header className="flex justify-between items-center mb-8 border-b border-[#1a1a1a] pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            {!schemaData
              ? "Data Ingestion"
              : !metrics
                ? "Data Readiness"
                : "Reconciliation Run"}
          </h1>
          <p className="text-sm text-[#8B96A8] mt-1">
            {!schemaData
              ? "Upload financial records for AI schema inference."
              : !metrics
                ? "Review AI mappings before execution."
                : "Batch orchestration and pipeline telemetry."}
          </p>
        </div>
        {schemaData && !metrics && (
          <button
            onClick={confirmAndReconcile}
            disabled={isRunning}
            className="flex items-center gap-2 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#00E5FF]/20 disabled:opacity-50 transition-all shadow-sm"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isRunning ? "Executing Batch..." : "Confirm & Reconcile"}
          </button>
        )}
      </header>

      {/* FILE UPLOAD DROPZONE */}
      {!schemaData && !metrics && (
        <GlowingDropzone
          onUpload={handleFileUpload}
          isUploading={isUploading}
        />
      )}

      {/* SCHEMA REVIEW */}
      {schemaData && !metrics && !isRunning && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-[#1a1a1a] bg-[#0A0A0A]">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full ${schemaData.readiness_score >= 80 ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[#F5B83D]/10 text-[#F5B83D]"}`}
            >
              {schemaData.readiness_score >= 80 ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-white font-medium">
                Readiness Score: {schemaData.readiness_score}%
              </h3>
              <p className="text-sm text-[#8B96A8] mt-0.5">
                {schemaData.readiness_score >= 80
                  ? "All required data sources identified. Ready for reconciliation."
                  : "Missing required datasets. Proceed with caution."}
              </p>
            </div>
          </div>

          {schemaData.warnings && schemaData.warnings.length > 0 && (
            <div className="p-4 rounded-xl border border-[#F5B83D]/20 bg-[#F5B83D]/5">
              <h4 className="text-[#F5B83D] font-medium text-sm flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" /> System Warnings
              </h4>
              <ul className="text-sm text-[#8B96A8] list-disc list-inside space-y-1">
                {schemaData.warnings.map((warning: string, i: number) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {schemaData.files.map((file: any, index: number) => (
              <SchemaEditor
                key={index}
                file={file}
                fileIndex={index}
                onUpdateMapping={handleMappingChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* TERMINAL EXECUTION */}
      {isRunning && (
        <div className="animate-in fade-in zoom-in-95 duration-500">
          <TerminalLogger />
        </div>
      )}

      {/* FINAL METRICS (Hidden until Confirm & Reconcile is clicked) */}
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
                LATENCY: API DEPENDENT
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
