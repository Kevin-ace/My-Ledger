/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Transaction } from '../types';
import { Smartphone, Send, Sparkles, CheckCircle2 } from 'lucide-react';

interface MpesaSimulatorProps {
  onNewMessageParsed: (text: string, parsedTx: Transaction) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export default function MpesaSimulator({ onNewMessageParsed, isLoading, setIsLoading }: MpesaSimulatorProps) {
  const [smsInput, setSmsInput] = useState<string>('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const presets = [
    {
      title: 'Groceries (Naivas)',
      text: 'Safaricom: QFH112PE7F Confirmed. Ksh6,800.00 paid to LIPA NA M-PESA TILL 559092 for NAIVAS SUPERMARKET. on 1/6/26 at 6:45 PM. New M-PESA balance was Ksh19,200.00.',
    },
    {
      title: 'Restaurant MJCJ',
      text: 'Safaricom: QDL523RE4M Confirmed. Ksh1,500.00 paid to CJ\'S RESTAURANT. on 2/6/26 at 1:12 PM. New M-PESA balance is Ksh12,700.00. Transaction cost, Ksh15.00.',
    },
    {
      title: 'Salary Deposit',
      text: 'Safaricom: QWE123RTY5 Confirmed. You have received Ksh120,000.00 from ALPHATECH LOGISTICS on 30/5/26 at 8:00 AM. New M-PESA balance is Ksh139,200.00.',
    },
    {
      title: 'Matatu Commute',
      text: 'Safaricom: QDF125TY9O Confirmed. Ksh250.00 paid to SUPER METRO TILL 702928. on 2/6/26 at 7:30 AM. New M-PESA balance Ksh12,450.00.',
    },
    {
      title: 'Money to cousin',
      text: 'Safaricom: QWE778TRP2 Confirmed. Ksh2,000.00 sent to JENNIFER WAITHRA on 2/6/26 at 9:00 AM. New M-PESA balance Ksh10,450.00.',
    },
  ];

  const handleSimulate = async (text: string) => {
    setIsLoading(true);
    setErrorText(null);
    setSuccessCode(null);

    try {
      const response = await fetch('/api/parse-mpesa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse M-Pesa. Verify network connection and API key state.');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('AI could not identify a valid transaction inside this text body. Please use standard M-Pesa confirmation template.');
      }

      const parsedTransaction: Transaction = {
        id: data.code || `MPESA_${Date.now()}`,
        code: data.code || 'TX_MANUAL',
        amount: data.amount,
        type: data.type,
        recipientOrSender: data.recipientOrSender,
        date: data.date,
        time: data.time || '10:00 AM',
        reason: data.reason || 'Ingested M-Pesa transaction',
        needsClarification: data.needsClarification ?? true,
        timestamp: Date.now(),
      };

      onNewMessageParsed(text, parsedTransaction);
      setSuccessCode(data.code);
      setSmsInput('');
      setTimeout(() => setSuccessCode(null), 4000);
    } catch (err: any) {
      setErrorText(err.message || 'Error parsing message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5" id="mpesa_simulator_card">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Smartphone className="w-5 h-5 text-[#81C784]" />
          <h3 className="font-sans font-bold text-slate-200 tracking-tight text-sm">M-Pesa SMS Sandbox</h3>
        </div>
        <p className="text-[11px] text-slate-500 font-mono">Pace a live M-Pesa confirmation SMS text inside the phone box below to simulate automatic ledger ingestion</p>
      </div>

      {/* Preset Badges container */}
      <div className="space-y-2">
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Simulate preset SMS flows</span>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.title}
              onClick={() => {
                setSmsInput(preset.text);
                setErrorText(null);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-800 bg-[#1C1C1E] hover:border-[#81C784] text-[10px] font-mono text-slate-300 transition-all cursor-pointer hover:scale-[1.01]"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Virtual Smartphone Sandbox Input */}
      <div className="bg-[#0C0C0E] rounded-3xl p-4 border border-slate-800/80 shadow-2xl relative flex flex-col gap-3" id="smartphone_view_shell">
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-14 h-3 bg-slate-900 rounded-full flex items-center justify-center">
          <span className="w-1 h-1 rounded-full bg-slate-800 inline-block"></span>
        </div>

        <div className="flex justify-between items-center text-[9px] text-slate-600 font-mono pt-2 border-b border-slate-900 pb-2">
          <span>Safaricom 4G</span>
          <span>Automatic Parse</span>
          <span>99% Battery</span>
        </div>

        <div className="flex-1">
          <label className="block text-[8px] text-[#81C784] font-mono tracking-widest uppercase mb-1.5 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> SMS Terminal Ingest
          </label>
          <textarea
            value={smsInput}
            onChange={(e) => {
              setSmsInput(e.target.value);
              setErrorText(null);
            }}
            placeholder="Paste standard Lipa na M-Pesa confirmation SMS here..."
            rows={4}
            className="w-full bg-[#141416]/90 border border-slate-800 rounded-2xl p-3 text-xs font-mono text-[#81C784] focus:outline-none focus:border-[#81C784] placeholder-slate-700 leading-relaxed resize-none"
            id="mpesa_sms_textarea"
          />
        </div>

        {/* Action Button bar */}
        <div className="flex flex-col gap-2">
          {errorText && (
            <span className="text-[9px] text-red-400 font-mono leading-relaxed bg-red-950/20 px-2.5 py-1.5 rounded-xl border border-red-900/30">
              ⚠️ {errorText}
            </span>
          )}

          {successCode && (
            <span className="text-[9px] text-[#81C784] font-mono flex items-center gap-1.5 bg-[#1C2C20]/40 px-2.5 py-1.5 rounded-xl border border-[#81C784]/20">
              <CheckCircle2 className="w-4 h-4 text-[#81C784]" /> SAFARICOM M-PESA INGEST SUCCESS! Code: {successCode}
            </span>
          )}

          <button
            onClick={() => handleSimulate(smsInput)}
            disabled={isLoading || !smsInput.trim()}
            className="w-full flex items-center justify-center gap-2 text-[11px] font-mono tracking-wider uppercase font-bold py-3.5 rounded-2xl bg-[#2E7D32] hover:bg-[#25632A] disabled:bg-slate-900 disabled:opacity-40 text-white transition-all cursor-pointer active:scale-98"
            id="btn_trigger_simulator"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                AI Ingesting SMS...
              </span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Force Simulate Ingestion
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
