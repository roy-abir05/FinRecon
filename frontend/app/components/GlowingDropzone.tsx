import { UploadCloud, Loader2 } from "lucide-react";
import React from "react";

interface GlowingDropzoneProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

export function GlowingDropzone({
  onUpload,
  isUploading,
}: GlowingDropzoneProps) {
  return (
    <div className="relative w-full rounded-xl p-[1px] overflow-hidden group cursor-pointer">
      {/* 
        1. The Animated Glowing Border 
        We make it larger than the container (inset-[-100%]) and spin it.
      */}
      <div className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0A0A0A_0%,#0A0A0A_50%,#00E5FF_75%,#9B7BFF_100%)] transition-opacity duration-500 opacity-40 group-hover:opacity-100" />

      {/* 
        2. The Inner Content
        This sits on top of the spinning background, leaving just a 1px gap (the padding from the parent).
      */}
      <div className="relative flex h-64 w-full flex-col items-center justify-center rounded-xl bg-[#0A0A0A] transition-colors hover:bg-[#0c0c0c]">
        <input
          type="file"
          multiple
          onChange={onUpload}
          disabled={isUploading}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          accept=".csv,.xlsx"
        />

        {isUploading ? (
          <Loader2 className="mb-3 h-10 w-10 animate-spin text-[#00E5FF]" />
        ) : (
          <div className="relative mb-3 flex items-center justify-center">
            {/* A subtle static glow behind the icon itself */}
            <div className="absolute h-12 w-12 rounded-full bg-[#00E5FF]/10 blur-xl group-hover:bg-[#00E5FF]/20 transition-all duration-500" />
            <UploadCloud className="h-10 w-10 text-[#333333] transition-colors duration-300 group-hover:text-[#00E5FF] relative z-10" />
          </div>
        )}

        <p className="font-mono text-sm tracking-wider text-white">
          {isUploading ? "INFERRING_SCHEMA..." : "DROP_FINANCIAL_DATA_HERE"}
        </p>
        <p className="mt-2 text-xs text-[#555555]">
          Orders, Gateway, and Bank statements (.csv, .xlsx)
        </p>
      </div>
    </div>
  );
}
