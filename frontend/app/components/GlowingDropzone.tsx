import { UploadCloud, Loader2, File, CheckCircle2 } from "lucide-react";
import React from "react";

interface GlowingDropzoneProps {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
  isUploading: boolean;
  selectedFiles: FileList | null;
}

export function GlowingDropzone({
  onFileSelect,
  onAnalyze,
  isUploading,
  selectedFiles,
}: GlowingDropzoneProps) {
  const fileArray = selectedFiles ? Array.from(selectedFiles) : [];

  return (
    <div className="relative w-full rounded-xl p-[1px] overflow-hidden group">
      {/* Animated Border */}
      <div className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0A0A0A_0%,#0A0A0A_50%,#00E5FF_75%,#9B7BFF_100%)] transition-opacity duration-500 opacity-40 group-hover:opacity-100" />

      <div className="relative flex min-h-[16rem] w-full flex-col items-center justify-center rounded-xl bg-[#0A0A0A] p-6 transition-colors hover:bg-[#0c0c0c]">
        {/* If no files selected yet, show the input overlay */}
        {!selectedFiles && (
          <input
            type="file"
            multiple
            onChange={onFileSelect}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            accept=".csv,.xlsx"
          />
        )}

        {isUploading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#00E5FF]" />
            <p className="font-mono text-sm text-white">INFERRING_SCHEMA...</p>
          </div>
        ) : !selectedFiles ? (
          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-3 flex items-center justify-center">
              <div className="absolute h-12 w-12 rounded-full bg-[#00E5FF]/10 blur-xl group-hover:bg-[#00E5FF]/20 transition-all duration-500" />
              <UploadCloud className="h-10 w-10 text-[#333333] transition-colors duration-300 group-hover:text-[#00E5FF] relative z-10" />
            </div>
            <p className="font-mono text-sm tracking-wider text-white">
              DROP_FINANCIAL_DATA_HERE
            </p>
            <p className="mt-2 text-xs text-[#555555]">
              Orders, Gateway, and Bank statements (.csv)
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
              <span className="text-sm font-medium text-white">
                {fileArray.length} files staged
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-6 w-full max-w-lg">
              {fileArray.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-[#111111] border border-[#222B3A] px-3 py-1.5 rounded-md text-xs font-mono text-[#8B96A8]"
                >
                  <File className="w-3 h-3 text-[#00E5FF]" />
                  {f.name}
                </div>
              ))}
            </div>

            <button
              onClick={onAnalyze}
              className="bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 px-6 py-2.5 rounded-lg text-sm font-mono hover:bg-[#00E5FF]/20 transition-all z-20 cursor-pointer"
            >
              INITIALIZE_AI_MAPPING
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
