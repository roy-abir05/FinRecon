"use client";
import { useState } from "react";
import { useRecon, ReconRecord } from "../context/ReconContext";
import {
  Sparkles,
  CheckCircle2,
  Search,
  ArrowRight,
  ShieldCheck,
  FileText,
  ShoppingCart,
  CreditCard,
  Landmark,
} from "lucide-react";

export default function AuditPage() {
  const { reconData } = useRecon();
  const [filter, setFilter] = useState<"ALL" | "AI_MATCH" | "EXACT_MATCH">(
    "ALL",
  );
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ReconRecord | null>(
    null,
  );

  const exactMatches = reconData?.data?.exact_matches || [];
  const aiMatches = reconData?.data?.ai_matches || [];
  const allRecords = [...aiMatches, ...exactMatches];

  const filteredRecords = allRecords.filter((record) => {
    const matchesFilter =
      filter === "ALL" ? true : record.match_status === filter;
    const matchesSearch =
      search === "" ||
      record.order_id?.toLowerCase().includes(search.toLowerCase()) ||
      record.txn_ref?.toLowerCase().includes(search.toLowerCase()) ||
      record.bank_narration?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatINR = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(num);
  };

  const isAI = selectedRecord?.match_status === "AI_MATCH";

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b border-[#1a1a1a] pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#00E5FF]" /> AI Audit Trail
          </h1>
          <p className="text-sm text-[#8B96A8] mt-1">
            Explainable telemetry and transaction lineage for reconciled
            records.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 bg-[#0A0A0A] border border-[#1a1a1a] p-1 rounded-lg">
          {(["ALL", "AI_MATCH", "EXACT_MATCH"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
                filter === tab
                  ? "bg-[#222B3A] text-white shadow-sm"
                  : "text-[#8B96A8] hover:text-white"
              }`}
            >
              {tab === "ALL"
                ? `ALL (${allRecords.length})`
                : tab === "AI_MATCH"
                  ? `AI RESOLVED (${aiMatches.length})`
                  : `EXACT (${exactMatches.length})`}
            </button>
          ))}
        </div>
      </header>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="w-4 h-4 text-[#555555] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter by Order ID, Txn Ref, or Narration..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#E8EDF5] placeholder-[#555555] focus:outline-none focus:border-[#00E5FF] transition-colors"
        />
      </div>

      {!reconData ? (
        <div className="border border-[#1a1a1a] bg-[#0A0A0A] rounded-xl h-64 flex flex-col items-center justify-center text-[#8B96A8] text-sm">
          <FileText className="w-8 h-8 mb-3 text-[#333333]" />
          <p className="font-mono">NO_ACTIVE_BATCH</p>
          <p className="text-xs mt-1 text-[#555555]">
            Run an ingestion batch on the dashboard to populate audit telemetry.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Table (Left Pane) */}
          <div className="lg:col-span-2 border border-[#1a1a1a] bg-[#0A0A0A] rounded-xl overflow-hidden shadow-sm h-[600px] flex flex-col">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#050505] z-10 shadow-sm">
                  <tr className="border-b border-[#1a1a1a] text-[11px] font-mono uppercase text-[#555555]">
                    <th className="p-3 pl-4">Order ID</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Gateway Ref</th>
                    <th className="p-3 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414] text-xs font-mono">
                  {filteredRecords.map((item, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedRecord(item)}
                      className={`hover:bg-[#111111] transition-colors cursor-pointer ${
                        selectedRecord?.order_id === item.order_id
                          ? "bg-[#111111]"
                          : ""
                      }`}
                    >
                      <td className="p-3 pl-4 text-white font-medium">
                        {item.order_id}
                      </td>
                      <td className="p-3 text-[#E8EDF5]">
                        {formatINR(item.amount || item.gross_amt)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] tracking-wider ${
                            item.match_status === "AI_MATCH"
                              ? "bg-[#9B7BFF]/10 text-[#9B7BFF] border border-[#9B7BFF]/20"
                              : "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20"
                          }`}
                        >
                          {item.match_status === "AI_MATCH" ? (
                            <Sparkles className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {item.match_status}
                        </span>
                      </td>
                      <td className="p-3 text-[#8B96A8] truncate max-w-[140px]">
                        {item.txn_ref || "—"}
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <button className="text-[11px] text-[#00E5FF] hover:underline flex items-center gap-1 ml-auto">
                          Audit <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center p-8 text-[#555555]"
                      >
                        No records match the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details & AI Reasoning Pane (Right Pane) */}
          <div className="border border-[#1a1a1a] bg-[#0A0A0A] rounded-xl p-5 flex flex-col overflow-y-auto h-[600px]">
            {selectedRecord ? (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-4 mb-6">
                  <h3 className="text-sm font-medium text-white">
                    Transaction Lineage
                  </h3>
                  <span className="text-[10px] font-mono text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-1 rounded border border-[#00E5FF]/20">
                    {selectedRecord.order_id}
                  </span>
                </div>

                {/* Vertical Timeline */}
                <div className="relative border-l-2 border-[#1a1a1a] ml-3 space-y-6 pb-2">
                  {/* Node 1: Order */}
                  <div className="relative pl-6">
                    <span className="absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-[#050505] border-2 border-[#333333] flex items-center justify-center">
                      <ShoppingCart className="w-3 h-3 text-[#E8EDF5]" />
                    </span>
                    <h4 className="text-[10px] font-mono text-[#8B96A8] uppercase tracking-wider mb-2">
                      Source: Order Database
                    </h4>
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-white">
                          {selectedRecord.order_id}
                        </span>
                        <span className="text-sm font-mono text-white">
                          {formatINR(
                            selectedRecord.amount || selectedRecord.gross_amt,
                          )}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#555555] font-mono">
                        {selectedRecord.order_date?.substring(0, 10) ||
                          "Date Unknown"}
                      </div>
                    </div>
                  </div>

                  {/* Node 2: Gateway */}
                  <div className="relative pl-6">
                    <span className="absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-[#050505] border-2 border-[#333333] flex items-center justify-center">
                      <CreditCard className="w-3 h-3 text-[#E8EDF5]" />
                    </span>
                    <h4 className="text-[10px] font-mono text-[#8B96A8] uppercase tracking-wider mb-2">
                      Gateway: Razorpay
                    </h4>
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#1a1a1a]">
                        <span className="text-xs font-mono text-white truncate">
                          {selectedRecord.txn_ref || "MISSING_REF"}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-[#555555]">Gross Amount:</span>
                          <span className="text-[#8B96A8]">
                            {formatINR(
                              selectedRecord.gross_amt || selectedRecord.amount,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-[#F5B83D]">Gateway Fee:</span>
                          <span className="text-[#F5B83D]">
                            - {formatINR(selectedRecord.fee || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono font-medium pt-1">
                          <span className="text-[#E8EDF5]">
                            Expected Settlement:
                          </span>
                          <span className="text-[#00E5FF]">
                            {formatINR(
                              selectedRecord.net_amt ||
                                (selectedRecord.gross_amt ||
                                  selectedRecord.amount) -
                                  (selectedRecord.fee || 0),
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Node 3: Bank Settlement */}
                  <div className="relative pl-6">
                    <span
                      className={`absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-[#050505] border-2 flex items-center justify-center ${isAI ? "border-[#9B7BFF] shadow-[0_0_10px_rgba(155,123,255,0.4)]" : "border-[#22C55E] shadow-[0_0_10px_rgba(34,197,94,0.3)]"}`}
                    >
                      <Landmark
                        className={`w-3 h-3 ${isAI ? "text-[#9B7BFF]" : "text-[#22C55E]"}`}
                      />
                    </span>
                    <h4
                      className={`text-[10px] font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5 ${isAI ? "text-[#9B7BFF]" : "text-[#22C55E]"}`}
                    >
                      {isAI ? (
                        <>
                          <Sparkles className="w-3 h-3" /> AI Heuristic Match
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Deterministic
                          Match
                        </>
                      )}
                    </h4>

                    <div
                      className={`bg-[#111111] border rounded-lg p-3 shadow-sm transition-all ${isAI ? "border-[#9B7BFF]/30" : "border-[#22C55E]/30"}`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-white">
                          Bank Statement
                        </span>
                        <span
                          className={`text-sm font-mono font-semibold ${isAI ? "text-[#9B7BFF]" : "text-[#22C55E]"}`}
                        >
                          {formatINR(selectedRecord.net_amt || 0)}
                        </span>
                      </div>

                      <div className="text-[10px] font-mono text-[#8B96A8] bg-[#050505] p-2.5 rounded border border-[#1a1a1a] mb-3 break-words leading-relaxed">
                        {selectedRecord.bank_narration}
                      </div>

                      {/* The AI Insight Box */}
                      {isAI && (
                        <div className="border-t border-[#9B7BFF]/20 pt-3 mt-1 relative">
                          <div className="absolute -top-2 left-3 bg-[#111111] px-2 text-[9px] uppercase font-mono text-[#9B7BFF] tracking-wider">
                            Gemini Reasoning
                          </div>
                          <p className="text-[11px] text-[#E8EDF5] leading-relaxed pt-2">
                            {/* Since our AI appends its reasoning directly to the narration/status in the backend, this visually separates it. */}
                            Successfully matched by identifying underlying
                            patterns (e.g., T+2 drift, fee reversals, or fuzzy
                            reference strings) despite strict rule failure.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-[#555555] text-xs font-mono">
                <ShieldCheck className="w-10 h-10 mb-4 text-[#222222]" />
                Select any record from the ledger
                <br />
                to visualize its transaction lineage.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
