import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

const LOADING_STEPS = [
  "Normalizing unstructured schemas...",
  "Executing high-speed deterministic rules...",
  "Identifying residual discrepancies...",
  "Waking Gemini heuristic resolver...",
  "Applying fuzzy logic to bank telemetry...",
  "Finalizing financial batch...",
];

export function PipelineLoader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1 < LOADING_STEPS.length ? prev + 1 : prev));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full rounded-xl border border-[#1a1a1a] bg-[#0A0A0A] h-72 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
      {/* Subtle background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#00E5FF]/5 blur-[60px] rounded-full" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative flex items-center justify-center w-14 h-14 mb-8">
          <div className="absolute inset-0 rounded-full border border-[#1a1a1a]" />
          <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-transparent border-t-[#00E5FF] animate-[spin_2s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
          <div className="absolute inset-2 rounded-full border-b-2 border-r-2 border-transparent border-b-[#9B7BFF] animate-[spin_3s_linear_infinite_reverse]" />
          <Sparkles className="w-4 h-4 text-white animate-pulse" />
        </div>

        <div className="h-6 relative w-96 flex items-center justify-center">
          {LOADING_STEPS.map((step, i) => (
            <p
              key={i}
              className={`absolute text-sm font-medium tracking-wide transition-all duration-700 ease-in-out ${
                index === i
                  ? "opacity-100 transform translate-y-0 text-[#E8EDF5]"
                  : index > i
                    ? "opacity-0 transform -translate-y-3 text-[#555555]"
                    : "opacity-0 transform translate-y-3 text-[#555555]"
              }`}
            >
              {step}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
