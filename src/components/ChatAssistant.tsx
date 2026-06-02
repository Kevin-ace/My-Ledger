/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, FormEvent } from "react";
import { ChatMessage, Transaction, BudgetLimit } from "../types";
import { Send, Sparkles, User, Bot, HelpCircle, Loader2 } from "lucide-react";

interface ChatAssistantProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  recentTransactions: Transaction[];
  budgetLimits: BudgetLimit[];
  onSelectTransactionToClarify: (tx: Transaction) => void;
}

export default function ChatAssistant({
  messages,
  onSendMessage,
  isLoading,
  recentTransactions,
  budgetLimits,
  onSelectTransactionToClarify,
}: ChatAssistantProps) {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText("");
  };

  // Find transactions that need clarification
  const pendingTransactions = recentTransactions.filter((tx) => tx.needsClarification);

  return (
    <div className="flex flex-col h-[520px]" id="chat_assistant_panel">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1C2C20] text-[#81C784] border border-[#81C784]/20 flex items-center justify-center font-bold relative">
            <Bot className="w-5 h-5" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#81C784] border-2 border-[#121214] rounded-full"></span>
          </div>
          <div>
            <h3 className="font-sans font-bold text-slate-200 text-xs">M-Ledger Buddy</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] text-[#81C784] font-bold font-mono tracking-wider uppercase">Active Helper</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span className="text-[8px] text-slate-500 font-mono">Gemini 3.5 Flash</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center p-1.5 bg-[#141416]/60 border border-slate-800 rounded-lg text-slate-500 hover:text-slate-300 cursor-help" title="Just type like: ' Naivas transaction of 1500 was groceries' or 'Received 2000 was cousin cashback' or ask a budget tip!">
          <HelpCircle className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Pending Clarifications Section inside Chat Drawer */}
      {pendingTransactions.length > 0 && (
        <div className="mb-3 bg-[#292015] border border-amber-900/30 rounded-xl p-3" id="pending_clarifications_container">
          <p className="text-[8px] font-mono font-bold text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Items waiting for details ({pendingTransactions.length})
          </p>
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {pendingTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => onSelectTransactionToClarify(tx)}
                className="flex items-center justify-between text-[11px] bg-[#141416]/60 hover:bg-[#1E1E1E] border border-slate-800/80 rounded-lg p-2 transition-all cursor-pointer"
              >
                <div className="truncate pr-2">
                  <span className="font-bold text-slate-300 font-mono">KES {tx.amount.toLocaleString()}</span>
                  <span className="text-slate-600 mx-1">to</span>
                  <span className="font-bold text-[#81C784] font-script truncate align-bottom">{tx.recipientOrSender}</span>
                </div>
                <button className="text-[8px] font-bold font-mono text-amber-500 uppercase px-1.5 py-0.5 bg-amber-950 rounded hover:bg-amber-900/40 transition-colors shrink-0">
                  Add Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-3 scroll-smooth" ref={scrollRef} id="chat_messages_scroll">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 max-w-[85%] ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                msg.sender === "user"
                  ? "bg-slate-800 text-slate-300"
                  : msg.sender === "system"
                  ? "bg-amber-955/40 text-amber-500 border border-amber-900/30"
                  : "bg-[#1C2C20] text-[#81C784]"
              }`}
            >
              {msg.sender === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
            </div>

            <div
              className={`p-3 rounded-2xl text-[11px] leading-relaxed ${
                msg.sender === "user"
                  ? "bg-[#2E7D32]/85 text-white rounded-tr-none"
                  : msg.sender === "system"
                  ? "bg-[#292015] text-amber-400 border border-amber-900/20 rounded-tl-none font-mono"
                  : "bg-[#1C1C1E] text-slate-200 border border-slate-800/60 rounded-tl-none"
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
              <span className="text-[7.5px] opacity-40 font-mono block text-right mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2 mr-auto animate-pulse">
            <div className="w-6 h-6 rounded-full bg-[#1C2C20] text-[#81C784] flex items-center justify-center">
              <Bot className="w-3 h-3 animate-bounce" />
            </div>
            <div className="bg-[#1C1C1E] text-slate-400 border border-slate-800 p-2.5 rounded-2xl rounded-tl-none flex items-center gap-1.5 text-xs text-slate-400">
              <Loader2 className="w-3 h-3 animate-spin text-[#81C784]" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Parsing query...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick-Pills for AI Budget advice */}
      <div className="mb-2">
        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block mb-1.5">Coach queries</span>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => !isLoading && onSendMessage("Provide a personalized spending audit and specific advice based on my current records.")}
            disabled={isLoading}
            className="px-2 py-1 text-[10px] font-mono text-slate-300 bg-[#1C1C1E] hover:border-[#81C784] border border-slate-800 rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            📊 Audit spending
          </button>
          <button
            type="button"
            onClick={() => !isLoading && onSendMessage("Give me creative local Kenyan advice on cutting transport costs and Paybill fees.")}
            disabled={isLoading}
            className="px-2 py-1 text-[10px] font-mono text-slate-300 bg-[#1C1C1E] hover:border-[#81C784] border border-slate-800 rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            💡 Kenya saving hacks
          </button>
        </div>
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSubmit} className="mt-auto pt-2 border-t border-slate-800/60" id="chat_input_form">
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="Tell Buddy about latest transaction or ask a budget tip..."
            className="w-full bg-[#141416]/90 border border-slate-800 focus:border-[#81C784] rounded-xl py-3 pl-3.5 pr-12 text-xs font-sans text-slate-200 placeholder-slate-650 focus:outline-none transition-all"
            id="chat_input_field"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-1.5 top-1.5 w-8 h-8 rounded-lg bg-[#2E7D32] hover:bg-[#25632A] disabled:opacity-30 disabled:hover:bg-[#2E7D32] text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
