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
} from "lucide-react";

export default function Dashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

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

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            System Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time pipeline telemetry and resolution metrics.
          </p>
        </div>
        <button
          onClick={runPipeline}
          disabled={isRunning}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isRunning ? "Running Engine..." : "Run Reconciliation Batch"}
        </button>
      </header>

      {!metrics && !isRunning && (
        <div className="border border-dashed border-gray-300 bg-gray-50 rounded-xl h-64 flex flex-col items-center justify-center text-gray-500 text-sm">
          <Database className="w-8 h-8 mb-3 text-gray-400" />
          <p>Awaiting pipeline execution.</p>
          <p className="text-xs mt-1 text-gray-400">
            Click the button above to process the synthetic batch.
          </p>
        </div>
      )}

      {metrics && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              title="Total Volume"
              value={metrics.total_records}
              icon={Database}
            />
            <KpiCard
              title="Match Rate"
              value={`${metrics.match_rate_percentage}%`}
              icon={CheckCircle2}
              highlight="text-green-600"
            />
            <KpiCard
              title="Deterministic"
              value={metrics.deterministic_matches}
              icon={Zap}
            />
            <KpiCard
              title="Exceptions"
              value={metrics.exceptions_escalated}
              icon={AlertCircle}
              highlight={
                metrics.exceptions_escalated > 0
                  ? "text-amber-600"
                  : "text-gray-900"
              }
            />
          </div>

          {/* The Reconciliation Funnel */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-6 uppercase tracking-wider">
              Resolution Funnel
            </h3>

            <div className="space-y-3">
              <FunnelBar
                label="Total Records Ingested"
                value={metrics.total_records}
                percentage={100}
                color="bg-gray-100"
              />
              <div className="flex justify-center">
                <ArrowRight className="w-4 h-4 text-gray-300 rotate-90" />
              </div>

              <FunnelBar
                label="Rule-Based (Deterministic)"
                value={metrics.deterministic_matches}
                percentage={
                  (metrics.deterministic_matches / metrics.total_records) * 100
                }
                color="bg-indigo-50"
                barColor="bg-indigo-500"
              />
              <div className="flex justify-center">
                <ArrowRight className="w-4 h-4 text-gray-300 rotate-90" />
              </div>

              <FunnelBar
                label="AI Resolver (Residual)"
                value={metrics.ai_resolved_matches}
                percentage={
                  (metrics.ai_resolved_matches / metrics.total_records) * 100
                }
                color="bg-purple-50"
                barColor="bg-purple-500"
              />
              <div className="flex justify-center">
                <ArrowRight className="w-4 h-4 text-gray-300 rotate-90" />
              </div>

              <FunnelBar
                label="Unresolved (Human Queue)"
                value={metrics.exceptions_escalated}
                percentage={
                  metrics.total_records === 0
                    ? 0
                    : (metrics.exceptions_escalated / metrics.total_records) *
                        100 || 2
                } // visual min width
                color="bg-rose-50"
                barColor="bg-rose-500"
                isException
              />
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Pipeline latency:{" "}
                <span className="font-mono text-gray-900">~1.2s</span>
              </span>
              <span className="text-gray-500">
                AI Cost per record:{" "}
                <span className="font-mono text-gray-900">$0.0001</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- UI Sub-components ---

function KpiCard({
  title,
  value,
  icon: Icon,
  highlight = "text-gray-900",
}: {
  title: string;
  value: string | number;
  icon: any;
  highlight?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className={`text-3xl font-semibold tracking-tight ${highlight}`}>
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
      className={`flex items-center justify-between p-3 rounded-lg ${color} border border-white/50`}
    >
      <div className="flex-1">
        <span
          className={`text-sm font-medium ${isException && value > 0 ? "text-rose-700" : "text-gray-700"}`}
        >
          {label}
        </span>
      </div>
      <div className="flex-1 flex justify-center">
        {/* The visual bar */}
        <div className="w-full bg-white/50 rounded-full h-2.5 max-w-xs overflow-hidden">
          <div
            className={`h-2.5 rounded-full ${barColor}`}
            style={{ width: `${Math.max(percentage, 1)}%` }}
          ></div>
        </div>
      </div>
      <div className="flex-1 flex justify-end">
        <span className="text-sm font-mono font-medium text-gray-900">
          {value} records
        </span>
      </div>
    </div>
  );
}
