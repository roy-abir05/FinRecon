"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  IndianRupee,
  Activity,
  Database
} from "lucide-react";
import { KpiCard } from "./components/KpiCard";
import { FunnelBar } from "./components/FunnelBar";
import { GlowingDropzone } from "./components/GlowingDropzone";
import { SchemaEditor } from "./components/SchemaEditor";
import { TerminalLogger } from "./components/TerminalLogger";
import { useRecon } from "./context/ReconContext";

export default function Dashboard() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [schemaData, setSchemaData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [rawFiles, setRawFiles] = useState<FileList | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const { reconData, setReconData } = useRecon();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setRawFiles(e.target.files);
    }
  };

  const handleFileUpload = async () => {
    if (!rawFiles) return;
    setIsUploading(true);

    const formData = new FormData();
    Array.from(rawFiles).forEach((file) => formData.append("files", file));

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
        headers: { "Content-Type": "application/json" },
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
          data: data.data,
        });
      }
    } catch (error) {
      console.error("Reconciliation failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const downloadCSV = () => {
    if (!reconData) return;
    const { exact_matches, ai_matches, exceptions } = reconData.data;
    const allRecords = [...exact_matches, ...ai_matches, ...exceptions];
    if (allRecords.length === 0) return;

    const headers = Object.keys(allRecords[0]);
    const csvContent = [
      headers.join(","),
      ...allRecords.map((row) =>
        headers
          .map((fieldName) => JSON.stringify(row[fieldName] || ""))
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `finrecon_master_ledger_${batchId || "latest"}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamically calculate financial metrics from the context data
  const financials = useMemo(() => {
    if (!reconData) return null;
    const { exact_matches, ai_matches, exceptions, orphan_bank_credits } =
      reconData.data;

    const sumAmt = (arr: any[]) =>
      arr.reduce(
        (sum, item) =>
          sum + (Number(item.amount) || Number(item.gross_amt) || 0),
        0,
      );
    const sumCredit = (arr: any[]) =>
      arr.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
    const sumFee = (arr: any[]) =>
      arr.reduce((sum, item) => sum + (Number(item.fee) || 0), 0);

    const totalVolume =
      sumAmt(exact_matches) + sumAmt(ai_matches) + sumAmt(exceptions);
    const reconciledAmt = sumAmt(exact_matches) + sumAmt(ai_matches);
    const unresolvedAmt = sumAmt(exceptions) + sumCredit(orphan_bank_credits);
    const totalFees = sumFee(exact_matches) + sumFee(ai_matches);
    const bankedAmt = reconciledAmt - totalFees;

    // Sort exceptions by monetary value for the Impact pane
    const topExceptions = [...exceptions]
      .sort(
        (a, b) =>
          (Number(b.amount) || Number(b.gross_amt) || 0) -
          (Number(a.amount) || Number(a.gross_amt) || 0),
      )
      .slice(0, 4);

    return {
      totalVolume,
      reconciledAmt,
      unresolvedAmt,
      totalFees,
      bankedAmt,
      topExceptions,
    };
  }, [reconData]);

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24">
      <header className="flex justify-between items-center mb-8 border-b border-[#1a1a1a] pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            {!schemaData
              ? "Data Ingestion"
              : !metrics
                ? "Data Readiness"
                : `Reconciliation Batch #${batchId?.substring(0, 6) || "042"}`}
          </h1>
          {metrics && financials ? (
            <p className="text-sm font-medium text-[#00E5FF] mt-1.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              FinRecon reconciled {metrics.match_rate_percentage}% of
              transaction value, with {formatINR(financials.unresolvedAmt)}{" "}
              remaining across {metrics.exceptions_escalated} exceptions.
            </p>
          ) : (
            <p className="text-sm text-[#8B96A8] mt-1">
              {!schemaData
                ? "Upload financial records for AI schema inference."
                : "Review AI mappings before execution."}
            </p>
          )}
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
          onFileSelect={handleFileSelect}
          onAnalyze={handleFileUpload}
          isUploading={isUploading}
          selectedFiles={rawFiles}
        />
      )}

      {/* SCHEMA REVIEW */}
      {schemaData && !metrics && !isRunning && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Reused existing schema review components here */}
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
              <h3 className="text-white font-medium flex items-center gap-2">
                Pre-Reconciliation Data Quality{" "}
                <ArrowRight className="w-4 h-4 text-[#555555]" />{" "}
                {schemaData.readiness_score}% Readiness
              </h3>
              <p className="text-sm text-[#8B96A8] mt-0.5">
                Required fields mapped successfully. Proceeding will trigger
                deterministic rules followed by the AI Resolver.
              </p>
            </div>
          </div>
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

      {/* FINAL METRICS - The "WOW" Dashboard */}
      {metrics && financials && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 1. Hero Financial KPIs */}
          <div className="grid grid-cols-5 gap-4">
            <KpiCard
              title="Total Volume"
              value={formatINR(financials.totalVolume)}
              icon={Database}
            />
            <KpiCard
              title="Match Rate"
              value={`${metrics.match_rate_percentage}%`}
              icon={CheckCircle2}
              highlight="text-[#22C55E]"
            />
            <KpiCard
              title="Reconciled Value"
              value={formatINR(financials.reconciledAmt)}
              icon={IndianRupee}
              highlight="text-[#35D6FF]"
            />
            <KpiCard
              title="Value at Risk"
              value={formatINR(financials.unresolvedAmt)}
              icon={AlertCircle}
              highlight="text-[#F05252]"
            />
            <KpiCard
              title="Exceptions"
              value={metrics.exceptions_escalated}
              icon={Activity}
              highlight="text-[#F5B83D]"
            />
          </div>

          {/* 2. The Money Flow (Sankey Alternative) */}
          <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-[#8B96A8] mb-6 uppercase tracking-wider">
              Where did the money go?
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-between text-center font-mono">
              <div className="p-4 bg-[#111111] rounded-lg border border-[#222B3A] w-full md:w-1/4">
                <p className="text-[10px] text-[#555555] mb-1">GROSS ORDERS</p>
                <p className="text-lg text-white">
                  {formatINR(financials.totalVolume)}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-[#333333] my-2 md:my-0" />
              <div className="p-4 bg-[#111111] rounded-lg border border-[#F5B83D]/30 w-full md:w-1/4">
                <p className="text-[10px] text-[#F5B83D] mb-1">
                  GATEWAY FEES DEDUCTED
                </p>
                <p className="text-lg text-[#F5B83D]">
                  - {formatINR(financials.totalFees)}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-[#333333] my-2 md:my-0" />
              <div className="p-4 bg-[#111111] rounded-lg border border-[#22C55E]/30 w-full md:w-1/4">
                <p className="text-[10px] text-[#22C55E] mb-1">ACTUAL BANKED</p>
                <p className="text-lg text-[#22C55E]">
                  {formatINR(financials.bankedAmt)}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-[#333333] my-2 md:my-0" />
              <div className="p-4 bg-[#111111] rounded-lg border border-[#F05252]/30 w-full md:w-1/4">
                <p className="text-[10px] text-[#F05252] mb-1">
                  UNRESOLVED SHORTFALL
                </p>
                <p className="text-lg text-[#F05252]">
                  {formatINR(financials.unresolvedAmt)}
                </p>
              </div>
            </div>
          </div>

          {/* 3. The Resolution Funnel & Exception Impact Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: AI Efficiency & Funnel */}
            <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-medium text-[#8B96A8] mb-1 uppercase tracking-wider">
                  How did FinRecon resolve the records?
                </h3>
                <p className="text-xs text-[#00E5FF] mb-6">
                  AI intervened for only{" "}
                  {(
                    (metrics.ai_resolved_matches / metrics.total_records) *
                    100
                  ).toFixed(1)}
                  % of edge cases.
                </p>
                <div className="space-y-3">
                  <FunnelBar
                    label="Initial Volume"
                    value={metrics.total_records}
                    percentage={100}
                    color="bg-[#111111]"
                    barColor="bg-[#333333]"
                  />
                  <FunnelBar
                    label="Rule-Based (Deterministic)"
                    value={metrics.deterministic_matches}
                    percentage={
                      (metrics.deterministic_matches / metrics.total_records) *
                      100
                    }
                    color="bg-[#111111]"
                    barColor="bg-[#35D6FF]"
                  />
                  <FunnelBar
                    label="Gemini AI (Fuzzy Logic)"
                    value={metrics.ai_resolved_matches}
                    percentage={
                      (metrics.ai_resolved_matches / metrics.total_records) *
                      100
                    }
                    color="bg-[#111111]"
                    barColor="bg-[#9B7BFF]"
                  />
                  <FunnelBar
                    label="Escalated to Human"
                    value={metrics.exceptions_escalated}
                    percentage={
                      (metrics.exceptions_escalated / metrics.total_records) *
                        100 || 2
                    }
                    color="bg-[#111111]"
                    barColor="bg-[#F05252]"
                    isException
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Exception Impact by $ */}
            <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-6 flex flex-col">
              <h3 className="text-sm font-medium text-[#8B96A8] mb-6 uppercase tracking-wider flex items-center justify-between">
                Where is the unresolved money?
                <span className="text-[#F05252] font-mono">
                  {formatINR(financials.unresolvedAmt)} at risk
                </span>
              </h3>

              <div className="flex-1 space-y-4">
                {financials.topExceptions.map((exc, i) => {
                  const val = Number(exc.amount) || Number(exc.gross_amt) || 0;
                  const pct = Math.min(
                    (val / financials.unresolvedAmt) * 100,
                    100,
                  );
                  return (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#E8EDF5]">
                          {exc.order_id || "UNKNOWN_ORDER"}
                        </span>
                        <span className="text-[#F05252]">{formatINR(val)}</span>
                      </div>
                      <div className="w-full bg-[#111111] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-[#F05252]"
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {financials.topExceptions.length === 0 && (
                  <p className="text-xs text-[#555555] font-mono mt-4">
                    No escalated exceptions found.
                  </p>
                )}
              </div>

              <button
                onClick={() => router.push("/exceptions")}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-[#F05252]/10 text-[#F05252] border border-[#F05252]/30 px-4 py-2.5 rounded-lg text-xs font-medium hover:bg-[#F05252]/20 transition-all"
              >
                Review Exceptions <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 px-5 py-2.5 rounded-lg text-xs font-mono hover:bg-[#00E5FF]/20 transition-all shadow-[0_0_15px_rgba(0,229,255,0.1)]"
            >
              <Download className="w-4 h-4" /> EXPORT_MASTER_LEDGER.csv
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
