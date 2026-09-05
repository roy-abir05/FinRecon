"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

export interface ReconRecord {
  order_id: string;
  order_date?: string;
  amount?: number;
  txn_ref?: string;
  net_amt?: number;
  fee?: number;
  match_status: string;
  bank_date?: string;
  bank_narration?: string;
  [key: string]: any;
}

export interface ReconPayload {
  metrics: {
    total_records: number;
    deterministic_matches: number;
    ai_resolved_matches: number;
    match_rate_percentage: number;
    exceptions_escalated: number;
  };
  data: {
    exact_matches: ReconRecord[];
    ai_matches: ReconRecord[];
    exceptions: ReconRecord[];
    orphan_bank_credits: any[];
  };
}

interface ReconContextType {
  reconData: ReconPayload | null;
  setReconData: (data: ReconPayload | null) => void;
}

const ReconContext = createContext<ReconContextType | undefined>(undefined);

export function ReconProvider({ children }: { children: React.ReactNode }) {
  const [reconData, setReconData] = useState<ReconPayload | null>(null);

  // Optional: Hydrate from session storage so a page reload doesn't wipe state
  useEffect(() => {
    const saved = sessionStorage.getItem("finrecon_payload");
    if (saved) {
      try {
        setReconData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved recon state", e);
      }
    }
  }, []);

  const handleSetReconData = (data: ReconPayload | null) => {
    setReconData(data);
    if (data) {
      sessionStorage.setItem("finrecon_payload", JSON.stringify(data));
    } else {
      sessionStorage.removeItem("finrecon_payload");
    }
  };

  return (
    <ReconContext.Provider
      value={{ reconData, setReconData: handleSetReconData }}
    >
      {children}
    </ReconContext.Provider>
  );
}

export function useRecon() {
  const context = useContext(ReconContext);
  if (!context) {
    throw new Error("useRecon must be used within a ReconProvider");
  }
  return context;
}
