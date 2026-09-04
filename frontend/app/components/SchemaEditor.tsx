import { FileText, ArrowRight } from "lucide-react";

const CANONICAL_OPTIONS = [
  "order_id",
  "linked_order",
  "txn_ref",
  "amount",
  "gross_amt",
  "net_amt",
  "fee",
  "order_date",
  "settled_at",
  "value_date",
  "narration",
  "credit",
  "ignore",
];

interface SchemaEditorProps {
  file: any;
  fileIndex: number;
  onUpdateMapping: (
    fileIndex: number,
    mappingIndex: number,
    newColumn: string,
  ) => void;
}

export function SchemaEditor({
  file,
  fileIndex,
  onUpdateMapping,
}: SchemaEditorProps) {
  return (
    <div className="border border-[#1a1a1a] bg-[#0A0A0A] rounded-xl overflow-hidden group hover:border-[#333333] transition-colors">
      {/* File Header */}
      <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0f0f0f]">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-[#00E5FF]" />
          <span className="text-sm font-medium text-white">
            {file.filename}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-1 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 rounded">
          {file.file_type}
        </span>
      </div>

      <div className="p-4">
        <p className="text-xs text-[#8B96A8] mb-6 leading-relaxed border-b border-dashed border-[#222B3A] pb-4">
          <span className="text-white font-medium">AI Reasoning:</span>{" "}
          {file.reasoning}
        </p>

        {/* The Mapping Grid */}
        <div className="space-y-3">
          <div className="flex justify-between px-2 text-[10px] font-mono uppercase text-[#555555]">
            <span>Raw Source Column</span>
            <span>FinRecon Target</span>
          </div>

          {file.mappings.map((mapping: any, mIdx: number) => (
            <div
              key={mIdx}
              className="flex items-center justify-between bg-[#111111] p-2 rounded-lg border border-[#1a1a1a]"
            >
              <span className="font-mono text-xs text-[#E8EDF5] pl-2 w-1/3 truncate">
                {mapping.source_column}
              </span>

              <ArrowRight className="w-3 h-3 text-[#444444]" />

              <select
                value={mapping.canonical_column}
                onChange={(e) =>
                  onUpdateMapping(fileIndex, mIdx, e.target.value)
                }
                className={`w-1/2 bg-[#050505] border text-xs font-mono rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition-all cursor-pointer ${
                  mapping.canonical_column === "ignore"
                    ? "text-[#555555] border-[#1a1a1a]"
                    : "text-[#00E5FF] border-[#222B3A]"
                }`}
              >
                {CANONICAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
