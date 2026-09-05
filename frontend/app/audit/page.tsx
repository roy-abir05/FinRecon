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

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b border-[#1a1a1a] pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#00E5FF]" /> AI Audit Trail
          </h1>
          <p className="text-sm text-[#8B96A8] mt-1">
            Explainable telemetry for rule-based and LLM-assisted
            reconciliations.
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
          {/* Main Table */}
          <div className="lg:col-span-2 border border-[#1a1a1a] bg-[#0A0A0A] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1a1a1a] bg-[#050505] text-[11px] font-mono uppercase text-[#555555]">
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
                        ₹{item.amount || item.gross_amt || "—"}
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
                </tbody>
              </table>
            </div>
          </div>

          {/* Details & AI Reasoning Pane */}
          <div className="border border-[#1a1a1a] bg-[#0A0A0A] rounded-xl p-5 flex flex-col justify-between">
            {selectedRecord ? (
              <div>
                <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-4 mb-4">
                  <h3 className="text-sm font-medium text-white">
                    Record Inspection
                  </h3>
                  <span className="text-[10px] font-mono text-[#00E5FF]">
                    {selectedRecord.order_id}
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-[#555555] uppercase text-[10px] font-mono block mb-1">
                      Match Type
                    </label>
                    <p className="text-[#E8EDF5] font-mono">
                      {selectedRecord.match_status}
                    </p>
                  </div>

                  <div>
                    <label className="text-[#555555] uppercase text-[10px] font-mono block mb-1">
                      Settlement Details
                    </label>
                    <div className="bg-[#050505] p-3 rounded border border-[#1a1a1a] font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#555555]">Gross:</span>
                        <span>
                          ₹{selectedRecord.amount || selectedRecord.gross_amt}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#555555]">Fee:</span>
                        <span>₹{selectedRecord.fee || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#555555]">Net Credited:</span>
                        <span className="text-[#00E5FF]">
                          ₹{selectedRecord.net_amt || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[#555555] uppercase text-[10px] font-mono block mb-1">
                      Bank Narration / Telemetry
                    </label>
                    <div className="bg-[#050505] p-3 rounded border border-[#1a1a1a] font-mono text-[#8B96A8] leading-relaxed break-words">
                      {selectedRecord.bank_narration ||
                        "Matched via strict amount & timestamp rules."}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-[#555555] text-xs font-mono">
                <ShieldCheck className="w-8 h-8 mb-2 text-[#222222]" />
                Select any record from the table to view match reasoning and
                transaction telemetry.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
