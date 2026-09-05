import { Terminal } from "lucide-react";
import React, { useState, useEffect } from "react";

const MOCK_LOGS = [
  "INITIALIZING FINRECON ENGINE v2.0.4...",
  "LOADING BATCH DATA FROM STAGING...",
  "APPLYING SCHEMA NORMALIZATION...",
  "EXECUTING DETERMINISTIC RULE MATCHER...",
  "PASS 1: EXACT AMOUNT & REF MATCH -> OK",
  "PASS 2: DATE TOLERANCE MATCH -> OK",
  "DETECTED RESIDUAL EXCEPTIONS.",
  "WAKING GEMINI AI RESOLVER (BATCH MODE)...",
  "AWAITING HEURISTIC INFERENCE...",
  "COMPILING FINAL METRICS...",
];

export function TerminalLogger() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs((prev) => {
        // Safely check against the length of the previous state
        if (prev.length < MOCK_LOGS.length) {
          return [...prev, MOCK_LOGS[prev.length]];
        }
        clearInterval(interval);
        return prev;
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full rounded-xl border border-[#1a1a1a] bg-[#050505] overflow-hidden shadow-2xl flex flex-col">
      {/* Mac-style terminal header */}
      <div className="flex items-center gap-2 border-b border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 shadow-sm">
        <Terminal className="w-4 h-4 text-[#555555]" />
        <span className="text-[10px] font-mono text-[#555555] uppercase tracking-widest">
          System / StdOut
        </span>
      </div>

      {/* Log Feed */}
      <div className="p-5 h-72 overflow-y-auto font-mono text-[11px] md:text-xs flex flex-col gap-2.5">
        {logs.map((log, i) => (
          <div
            key={i}
            className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {/* Timestamp */}
            <span className="text-[#333333] shrink-0">
              [{new Date().toISOString().substring(11, 23)}]
            </span>
            {/* Syntax Highlighting based on keywords, with optional chaining (?.) for safety */}
            <span
              className={
                log?.includes("OK")
                  ? "text-[#22C55E]"
                  : log?.includes("AI") || log?.includes("GEMINI")
                    ? "text-[#9B7BFF]"
                    : log?.includes("ERROR")
                      ? "text-[#F05252]"
                      : "text-[#00E5FF]"
              }
            >
              <span className="text-[#555555] mr-2">{">"}</span>
              {log}
            </span>
          </div>
        ))}

        {/* Blinking Cursor */}
        {logs.length < MOCK_LOGS.length && (
          <div className="flex gap-4 animate-pulse mt-1">
            <span className="text-[#333333] shrink-0">
              [{new Date().toISOString().substring(11, 23)}]
            </span>
            <span className="text-[#8B96A8]">
              <span className="text-[#555555] mr-2">{">"}</span>_
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
