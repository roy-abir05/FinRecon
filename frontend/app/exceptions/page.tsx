"use client";
import { useState } from "react";
import { useRecon, ReconRecord } from "../context/ReconContext";
import {
  AlertTriangle,
  AlertCircle,
  Link as LinkIcon,
  Flag,
  ArrowRight,
  Wallet,
} from "lucide-react";

export default function ExceptionsPage() {
  const { reconData } = useRecon();
  const [selectedException, setSelectedException] =
    useState<ReconRecord | null>(null);

  const exceptions = reconData?.data?.exceptions || [];
  const orphanCredits = reconData?.data?.orphan_bank_credits || [];

  // Calculate total financial impact of exceptions
  const totalImpact = exceptions.reduce(
    (sum, record) => sum + (record.amount || record.gross_amt || 0),
    0,
  );

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b border-[#1a1a1a] pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-[#F05252]" /> Exception Queue
          </h1>
          <p className="text-sm text-[#8B96A8] mt-1">
            Human-in-the-loop triage for unresolved financial discrepancies.
          </p>
        </div>

        {/* High-level Impact Metric */}
        <div className="text-right">
          <p className="text-[10px] font-mono text-[#555555] uppercase tracking-wider mb-1">
            Financial Impact
          </p>
          <p className="text-xl font-mono text-[#F05252]">
            ₹
            {totalImpact.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </header>

      {!reconData ? (
        <div className="border border-[#1a1a1a] bg-[#0A0A0A] rounded-xl h-64 flex flex-col items-center justify-center text-[#8B96A8] text-sm">
          <AlertCircle className="w-8 h-8 mb-3 text-[#333333]" />
          <p className="font-mono">QUEUE_EMPTY</p>
          <p className="text-xs mt-1 text-[#555555]">
            No active batches. Awaiting ingestion pipeline.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT PANE: Unmatched Orders */}
          <div className="border border-[#1a1a1a] bg-[#0A0A0A] rounded-xl overflow-hidden shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b border-[#1a1a1a] bg-[#050505] flex items-center justify-between">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#F5B83D]" /> Escalated
                Orders ({exceptions.length})
              </h3>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-2">
              {exceptions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedException(item)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedException?.order_id === item.order_id
                      ? "border-[#F5B83D]/50 bg-[#F5B83D]/10"
                      : "border-[#1a1a1a] bg-[#111111] hover:border-[#333333]"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-white">
                      {item.order_id}
                    </span>
                    <span className="text-xs font-mono text-[#F05252]">
                      ₹{item.amount || item.gross_amt || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-[#8B96A8]">
                    <span>
                      Date: {item.order_date?.substring(0, 10) || "—"}
                    </span>
                    <span>Ref: {item.txn_ref || "MISSING"}</span>
                  </div>
                </div>
              ))}
              {exceptions.length === 0 && (
                <div className="text-center p-8 text-xs font-mono text-[#555555]">
                  No escalated orders.
                </div>
              )}
            </div>

            {/* Resolution Action Bar */}
            <div className="p-4 border-t border-[#1a1a1a] bg-[#050505]">
              <button
                disabled={!selectedException}
                className="w-full flex items-center justify-center gap-2 bg-[#F5B83D]/10 text-[#F5B83D] border border-[#F5B83D]/30 px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#F5B83D]/20 disabled:opacity-30 transition-all"
              >
                <Flag className="w-3.5 h-3.5" /> Flag for Investigation
              </button>
            </div>
          </div>

          {/* RIGHT PANE: Orphan Bank Credits */}
          <div className="border border-[#1a1a1a] bg-[#0A0A0A] rounded-xl overflow-hidden shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b border-[#1a1a1a] bg-[#050505] flex items-center justify-between">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#00E5FF]" /> Orphan Bank
                Credits ({orphanCredits.length})
              </h3>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-2">
              {orphanCredits.map((credit: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-[#1a1a1a] bg-[#111111] group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-[#00E5FF]">
                      ₹{credit.credit}
                    </span>
                    <span className="text-[10px] font-mono text-[#8B96A8]">
                      {credit.value_date?.substring(0, 10)}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#8B96A8] break-words bg-[#050505] p-2 rounded">
                    {credit.narration}
                  </div>

                  {/* Manual Link button (appears on hover) */}
                  <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      disabled={!selectedException}
                      className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider bg-[#00E5FF]/10 text-[#00E5FF] px-2 py-1 rounded border border-[#00E5FF]/20 hover:bg-[#00E5FF]/20 disabled:opacity-30"
                    >
                      <LinkIcon className="w-3 h-3" /> Force Match to Selected
                    </button>
                  </div>
                </div>
              ))}
              {orphanCredits.length === 0 && (
                <div className="text-center p-8 text-xs font-mono text-[#555555]">
                  No orphan credits.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
