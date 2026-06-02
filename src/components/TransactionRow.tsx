/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Transaction } from "../types";
import { Wallet } from "lucide-react";

interface TransactionRowProps {
  key?: string;
  tx: Transaction;
  onQuickClarify: (id: string, reason: string) => void;
}

export default function TransactionRow({ tx, onQuickClarify }: TransactionRowProps) {
  const [editedReason, setEditedReason] = useState(tx.reason);

  // Sync state if transaction changes
  useEffect(() => {
    setEditedReason(tx.reason);
  }, [tx.reason]);

  return (
    <div 
      className={`p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
        tx.needsClarification 
          ? "border border-amber-900/40 bg-[#292015] shadow-xs" 
          : "border border-slate-800 bg-[#1C1C1E] hover:bg-[#252528]"
      }`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className={`p-2.5 rounded-xl shrink-0 ${tx.type === "income" ? "bg-[#1C2C20]" : "bg-[#2C2C2E]"}`}>
          <Wallet className={`w-4 h-4 ${tx.type === "income" ? "text-[#81C784]" : "text-slate-400"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span className="font-bold font-mono text-[#81C784] shrink-0">{tx.code}</span>
            <h4 className="font-bold font-script text-white text-xs">{tx.recipientOrSender}</h4>
            <span className="text-[9px] text-[#81C784]/65 font-mono">{tx.date}</span>
          </div>
          
          {/* Clarify input */}
          <div className="mt-2">
            <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider mb-0.5">Reason / Purpose</label>
            <input
              type="text"
              value={editedReason}
              onChange={(e) => setEditedReason(e.target.value)}
              placeholder="What specifically did you buy or receive here?"
              className="w-full text-xs font-sans text-slate-200 bg-[#141416] border border-slate-800 focus:border-[#81C784] rounded-lg p-1.5 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 border-t sm:border-transparent border-slate-800/80 pt-2 sm:pt-0 shrink-0">
        <div className="text-right">
          <span className={`text-xs font-bold font-mono ${tx.type === "income" ? "text-[#81C784]" : "text-[#E57373]"}`}>
            {tx.type === "income" ? "+" : "-"}KES {tx.amount.toLocaleString()}
          </span>
          {tx.needsClarification && (
            <span className="block text-[8px] text-amber-500 font-bold uppercase font-mono tracking-wider mt-0.5 animate-pulse">
              Needs Details
            </span>
          )}
        </div>
        
        {(tx.reason !== editedReason || tx.needsClarification) && (
          <button
            onClick={() => onQuickClarify(tx.id, editedReason)}
            className="bg-[#2E7D32] hover:bg-[#25632A] text-white font-bold text-[9px] uppercase font-mono px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Save Details
          </button>
        )}
      </div>
    </div>
  );
}
