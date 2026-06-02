/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { BudgetLimit, Transaction } from '../types';
import { Settings, Plus, Trash2, ShieldAlert, BadgeInfo, CheckCircle } from 'lucide-react';

interface BudgetSettingsProps {
  limits: BudgetLimit[];
  onChangeLimits: (newLimits: BudgetLimit[]) => void;
  transactions: Transaction[];
}

export default function BudgetSettings({ limits, onChangeLimits, transactions }: BudgetSettingsProps) {
  const [editingKeyword, setEditingKeyword] = useState<string | null>(null);
  const [addingLimit, setAddingLimit] = useState<boolean>(false);
  const [customKeyword, setCustomKeyword] = useState<string>('');
  const [customVal, setCustomVal] = useState<string>('');

  // Calculate current spend for transactions matching a keyword (case-insensitive in payee name or reason text)
  const getSpendForKeyword = (keyword: string) => {
    const term = (keyword || '').toLowerCase().trim();
    if (!term) return 0;
    return (transactions || [])
      .filter((tx) => {
        if (!tx || tx.type !== 'expense') return false;
        const payee = tx.recipientOrSender ? String(tx.recipientOrSender).toLowerCase() : '';
        const reasonStr = tx.reason ? String(tx.reason).toLowerCase() : '';
        return payee.includes(term) || reasonStr.includes(term);
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const handleUpdateLimit = (keyword: string, value: number) => {
    const cleanedKeyword = (keyword || '').trim();
    if (!cleanedKeyword) return;
    
    // Find if already exists
    const exists = (limits || []).some((lim) => lim && typeof lim.keyword === 'string' && lim.keyword.toLowerCase() === cleanedKeyword.toLowerCase());
    
    let updated: BudgetLimit[];
    if (exists) {
      updated = (limits || []).map((lim) => {
        if (lim && typeof lim.keyword === 'string' && lim.keyword.toLowerCase() === cleanedKeyword.toLowerCase()) {
          return { ...lim, limit: value };
        }
        return lim;
      });
    } else {
      updated = [...(limits || []), { keyword: cleanedKeyword, limit: value }];
    }
    
    onChangeLimits(updated);
    setEditingKeyword(null);
  };

  const handleDeleteLimit = (keyword: string) => {
    onChangeLimits(limits.filter((l) => l.keyword !== keyword));
  };

  const handleAddCustomLimit = (e: FormEvent) => {
    e.preventDefault();
    const num = parseFloat(customVal);
    if (!customKeyword.trim() || isNaN(num) || num <= 0) return;

    handleUpdateLimit(customKeyword.trim(), num);
    setCustomKeyword('');
    setCustomVal('');
    setAddingLimit(false);
  };

  return (
    <div className="space-y-5" id="budget_limits_manager">
      <div className="flex justify-between items-start pb-2 border-b border-slate-800/80">
        <div>
          <h3 className="font-sans font-bold text-slate-200 tracking-tight text-sm">Dynamic Budget Alerts</h3>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">Define tracking keywords (e.g. "Naivas", "Metro") to target specific spending</p>
        </div>

        {!addingLimit ? (
          <button
            onClick={() => setAddingLimit(true)}
            className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl bg-[#2E7D32] hover:bg-[#25632A] text-white transition-all cursor-pointer"
            id="btn_add_budget_limit"
          >
            <Plus className="w-3.5 h-3.5" />
            Set limit
          </button>
        ) : (
          <button
            onClick={() => setAddingLimit(false)}
            className="text-[10px] font-mono tracking-wider uppercase text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>

      {addingLimit && (
        <form onSubmit={handleAddCustomLimit} className="p-4 bg-[#141416] border border-slate-800 rounded-2xl space-y-3" id="form_add_budget">
          <div className="grid grid-cols-2 gap-3" id="input_grid_add_budget">
            <div>
              <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Keyword / Label</label>
              <input
                type="text"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder="e.g. Naivas, Metro, Dinner"
                className="w-full text-xs bg-[#1C1C1E] border border-slate-800 rounded-xl p-2 font-medium text-slate-350 outline-none focus:border-[#81C784]"
                required
              />
            </div>
            <div>
              <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Limit (KES)</label>
              <input
                type="number"
                value={customVal}
                onChange={(e) => setCustomVal(e.target.value)}
                placeholder="Limit target KES"
                className="w-full text-xs bg-[#1C1C1E] border border-slate-800 rounded-xl p-2 font-mono text-slate-300 outline-none focus:border-[#81C784]"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1 text-[11px] font-mono uppercase bg-[#2E7D32] hover:bg-[#25632A] text-white rounded-xl py-2 font-bold cursor-pointer"
            id="btn_submit_add_budget"
          >
            Create Alert tag
          </button>
        </form>
      )}

      {/* Limits status list */}
      <div className="space-y-3">
        {limits.length === 0 ? (
          <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <Settings className="w-8 h-8 mx-auto text-slate-600 stroke-1 mb-2 animate-spin-slow" />
            <p className="text-xs font-mono">No alert budgets defined. Click "Set Limit" to track a keyword.</p>
          </div>
        ) : (
          limits.map((lim) => {
            if (!lim || typeof lim.keyword !== 'string') return null;
            const currentSpend = getSpendForKeyword(lim.keyword);
            const progress = lim.limit > 0 ? (currentSpend / lim.limit) * 100 : 0;
            const isExceeded = currentSpend > lim.limit;
            const isNearing = progress >= 80 && !isExceeded;

            return (
              <div
                key={lim.keyword}
                className={`p-3.5 border rounded-2xl transition-all ${
                  isExceeded
                    ? 'border-red-900/30 bg-[#351D1D]/30'
                    : isNearing
                    ? 'border-amber-900/20 bg-[#292015]/30'
                    : 'border-slate-800 bg-[#1C1C1E] hover:bg-[#252528]'
                }`}
                id={`budget_row_${String(lim.keyword).toLowerCase().replace(/\s+/g, '_')}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-xs font-bold font-script text-[#81C784] tracking-wide">Matches: "{lim.keyword}"</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Spent: <span className="font-bold text-slate-200">KES {currentSpend.toLocaleString()}</span> of {lim.limit.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingKeyword === lim.keyword ? (
                      <input
                        type="number"
                        defaultValue={lim.limit}
                        onBlur={(e) => handleUpdateLimit(lim.keyword, parseFloat(e.target.value) || lim.limit)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateLimit(lim.keyword, parseFloat((e.target as HTMLInputElement).value) || lim.limit);
                          }
                        }}
                        className="w-20 text-xs px-2 py-0.5 bg-[#141416] border border-slate-800 text-slate-300 font-mono rounded-lg outline-none focus:border-[#81C784]"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setEditingKeyword(lim.keyword)}
                        className="text-[9px] font-mono uppercase tracking-wider text-[#81C784] hover:underline cursor-pointer font-bold"
                      >
                        Adjust
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteLimit(lim.keyword)}
                      className="text-slate-500 hover:text-[#E57373] p-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#141416] h-1.5 rounded-full overflow-hidden mt-2 relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isExceeded
                        ? 'bg-[#EF4444]'
                        : isNearing
                        ? 'bg-amber-400'
                        : 'bg-[#10B981]'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>

                {/* Status Notice */}
                <div className="flex items-center justify-between text-[9px] font-mono mt-2 select-none">
                  <div className="flex items-center gap-1">
                    {isExceeded ? (
                      <span className="text-[#E57373] font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 animate-bounce" /> Exceeded!
                      </span>
                    ) : isNearing ? (
                      <span className="text-amber-500 font-semibold flex items-center gap-1">
                        <BadgeInfo className="w-3 h-3" /> Nearing cap ({Math.round(progress)}%)
                      </span>
                    ) : (
                      <span className="text-[#81C784] font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-[#81C784]" /> Safe ({Math.round(progress)}%)
                      </span>
                    )}
                  </div>

                  <span className="text-slate-500">
                    {progress > 100 ? 'Limit Exceeded' : `${Math.round(100 - progress)}% remaining`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
