/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { Transaction, BudgetLimit, ChatMessage, SystemNotification } from './types';
import SpendingCharts from './components/SpendingCharts';
import BudgetSettings from './components/BudgetSettings';
import MpesaSimulator from './components/MpesaSimulator';
import ChatAssistant from './components/ChatAssistant';
import TransactionRow from './components/TransactionRow';
import { 
  Home as HomeIcon, 
  Receipt, 
  Settings as SettingsIcon, 
  Smartphone, 
  Bot, 
  Plus, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  Wallet, 
  Bell, 
  Sparkles, 
  X, 
  ArrowUpRight, 
  ArrowDownRight,
  Search
} from 'lucide-react';

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "MP_TR1",
    code: "QFH112PE7F",
    amount: 6800,
    type: "expense",
    recipientOrSender: "NAIVAS SUPERMARKET",
    date: "June 1, 2026",
    time: "6:45 PM",
    reason: "Family grocery shopping trip",
    needsClarification: false,
    timestamp: Date.now() - 24 * 3600 * 1050,
  },
  {
    id: "MP_TR2",
    code: "QDL523RE4M",
    amount: 1500,
    type: "expense",
    recipientOrSender: "CJ'S RESTAURANT",
    date: "June 2, 2026",
    time: "1:12 PM",
    reason: "Clarify: Lunch details or meeting note",
    needsClarification: true,
    timestamp: Date.now() - 2 * 3600 * 1000,
  },
  {
    id: "MP_TR3",
    code: "QWE123RTY5",
    amount: 120000,
    type: "income",
    recipientOrSender: "ALPHATECH LOGISTICS",
    date: "May 30, 2026",
    time: "8:00 AM",
    reason: "Monthly salary payout",
    needsClarification: false,
    timestamp: Date.now() - 3 * 24 * 3600 * 1000,
  },
  {
    id: "MP_TR4",
    code: "QDF125TY9O",
    amount: 250,
    type: "expense",
    recipientOrSender: "SUPER METRO TILL",
    date: "June 2, 2026",
    time: "7:30 AM",
    reason: "Clarify: Route or trip commute details",
    needsClarification: true,
    timestamp: Date.now() - 8 * 3600 * 1000,
  },
  {
    id: "MP_TR5",
    code: "QWE778TRP2",
    amount: 2000,
    type: "expense",
    recipientOrSender: "JENNIFER WAITHRA",
    date: "June 2, 2026",
    time: "9:00 AM",
    reason: "Cash transfer regarding chama dues",
    needsClarification: false,
    timestamp: Date.now() - 6 * 3600 * 1000,
  }
];

const DEFAULT_LIMITS: BudgetLimit[] = [
  { keyword: "Naivas", limit: 30000 },
  { keyword: "Metro", limit: 5000 },
  { keyword: "Restaurant", limit: 10000 },
  { keyword: "Chama", limit: 15000 }
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "MSG1",
    sender: "assistant",
    text: "Heeey Kevin! Ready to audit your M-Pesa ledger? 🇰🇪\n\nI am your companion financial buddy. Click on any of the unconfirmed transactions to set what you bought, or type below for a quick spending evaluation!",
    timestamp: Date.now() - 10 * 3600 * 1000,
  }
];

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('mpesa_transactions');
    if (!saved) return DEFAULT_TRANSACTIONS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          id: item.id || `TX_${Math.random().toString(36).substring(2, 9)}`,
          code: item.code || 'M_UNKNOWN',
          amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0,
          type: item.type === 'income' ? 'income' : 'expense',
          recipientOrSender: item.recipientOrSender || 'Lipa na M-Pesa Merchant',
          date: item.date || 'June 2, 2026',
          time: item.time || '10:00 AM',
          reason: item.reason || item.explanation || 'Ingested M-Pesa transaction',
          needsClarification: item.needsClarification ?? true,
          timestamp: item.timestamp || Date.now(),
        }));
      }
    } catch (e) {
      console.error('Failed to parse active transactions:', e);
    }
    return DEFAULT_TRANSACTIONS;
  });

  const [limits, setLimits] = useState<BudgetLimit[]>(() => {
    const saved = localStorage.getItem('mpesa_limits');
    if (!saved) return DEFAULT_LIMITS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          const rawKeyword = item.keyword || item.category || 'Other';
          return {
            keyword: typeof rawKeyword === 'string' ? rawKeyword : 'Other',
            limit: typeof item.limit === 'number' ? item.limit : parseFloat(item.limit) || 0,
          };
        });
      }
    } catch (e) {
      console.error('Failed to parse active limits:', e);
    }
    return DEFAULT_LIMITS;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('mpesa_messages');
    return saved ? JSON.parse(saved) : DEFAULT_MESSAGES;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'transactions' | 'budget' | 'simulator' | 'coach'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  
  const [hideBalances, setHideBalances] = useState(false);

  // Modal / overlay for manual additions
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [manualRecipient, setManualRecipient] = useState('');
  const [manualType, setManualType] = useState<'income' | 'expense'>('expense');
  const [manualReason, setManualReason] = useState('');

  const [selectedPeriod, setSelectedPeriod] = useState('1 Month');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('mpesa_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('mpesa_limits', JSON.stringify(limits));
  }, [limits]);

  useEffect(() => {
    localStorage.setItem('mpesa_messages', JSON.stringify(messages));
  }, [messages]);

  // Check budget limits of keyword-based tags
  useEffect(() => {
    const alerts: SystemNotification[] = [];
    
    limits.forEach((lim) => {
      if (!lim || typeof lim.keyword !== 'string') return;
      const term = lim.keyword.toLowerCase().trim();
      if (!term) return;

      const budgetSpend = transactions
        .filter((t) => {
          if (!t || t.type !== 'expense') return false;
          const payee = t.recipientOrSender ? String(t.recipientOrSender).toLowerCase() : '';
          const reasonText = t.reason ? String(t.reason).toLowerCase() : '';
          return payee.includes(term) || reasonText.includes(term);
        })
        .reduce((sum, t) => sum + t.amount, 0);

      if (budgetSpend > lim.limit) {
        alerts.push({
          id: `alert_limit_${lim.keyword}`,
          message: `Budget warning! You have exceeded your target of Ksh ${lim.limit.toLocaleString()} for "${lim.keyword}" (Current spend: Ksh ${budgetSpend.toLocaleString()})!`,
          type: 'warning',
          timestamp: Date.now(),
          read: false
        });
      } else if (budgetSpend >= lim.limit * 0.8) {
        alerts.push({
          id: `alert_nearing_${lim.keyword}`,
          message: `Heads up: You have spent ${Math.round((budgetSpend / lim.limit) * 100)}% of your Ksh ${lim.limit.toLocaleString()} target limit for "${lim.keyword}".`,
          type: 'info',
          timestamp: Date.now(),
          read: false
        });
      }
    });

    setNotifications(alerts);
  }, [transactions, limits]);

  // Total Money Calculations
  const totalMoneyIn = useMemo(() => {
    return transactions
      .filter(t => t && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalMoneyOut = useMemo(() => {
    return transactions
      .filter(t => t && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Handle M-Pesa sandbox parsed tx
  const handleNewMessageParsed = (text: string, parsedTx: Transaction) => {
    setTransactions((prev) => [parsedTx, ...prev]);

    const autoAssistantMsg: ChatMessage = {
      id: `system_${Date.now()}`,
      sender: 'assistant',
      text: `🔔 *SMS ALERT RECEIVED!*\nIngested M-Pesa Code **${parsedTx.code}**: \n💸 **KES ${parsedTx.amount.toLocaleString()}** spent at **${parsedTx.recipientOrSender}** registering as: _"${parsedTx.reason}"_.\n\nPlease type inside the chat what this item was for directly!`,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, autoAssistantMsg]);
    setShowAddMenu(false);
  };

  // Conversational API proxy
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages,
          context: {
            recentTransactions: transactions.slice(0, 10),
            budgetLimits: limits,
          }
        })
      });

      if (!response.ok) {
        throw new Error("Chat Buddy went offline. Check network state.");
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: data.text,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Apply dynamic actions from AI response
      if (data.action && data.action.type === 'update_transaction') {
        const targetIdOrCode = data.action.transactionId;
        const updates = data.action.updates;

        setTransactions((prev) => prev.map((tx) => {
          if (tx.id === targetIdOrCode || tx.code === targetIdOrCode) {
            return {
              ...tx,
              reason: updates.reason || tx.reason,
              needsClarification: false
            };
          }
          return tx;
        }));

        const changeLogMsg: ChatMessage = {
          id: `system_ack_${Date.now()}`,
          sender: 'system',
          text: `⚙️ Adjusted transaction code (${targetIdOrCode}) with reason: "${updates.reason || 'Reviewed'}"`,
          timestamp: Date.now()
        };
        setTimeout(() => {
          setMessages((prev) => [...prev, changeLogMsg]);
        }, 1000);
      } else if (data.action && data.action.type === 'add_budget_limit') {
        const updates = data.action.updates;
        if (updates.keyword && updates.limit) {
          setLimits((prev) => {
            const filtered = prev.filter(l => l.keyword.toLowerCase() !== updates.keyword.toLowerCase());
            return [...filtered, { keyword: updates.keyword, limit: updates.limit }];
          });
        }
      }

    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'system',
        text: `⚠️ AI Offline: ${err.message || 'Check GEMINI_API_KEY settings.'}`,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleQuickClarify = (txId: string, customReason: string) => {
    setTransactions((prev) => prev.map((tx) => {
      if (tx.id === txId) {
        return {
          ...tx,
          reason: customReason,
          needsClarification: false
        };
      }
      return tx;
    }));
  };

  const handleManualAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(manualAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const newTx: Transaction = {
      id: `MAN_TX_${Date.now()}`,
      code: `M_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      amount: amountNum,
      type: manualType,
      recipientOrSender: manualRecipient || 'Lipa na M-Pesa Merchant',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reason: manualReason || `Manual logged ${manualType}`,
      needsClarification: false,
      timestamp: Date.now()
    };

    setTransactions((prev) => [newTx, ...prev]);
    setShowAddMenu(false);
    
    // Reset fields
    setManualAmount('');
    setManualRecipient('');
    setManualReason('');
  };

  // Global log query filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx) return false;
      const searchLower = (searchQuery || '').toLowerCase();
      const payee = tx.recipientOrSender ? String(tx.recipientOrSender).toLowerCase() : '';
      const reasonStr = tx.reason ? String(tx.reason).toLowerCase() : '';
      const codeStr = tx.code ? String(tx.code).toLowerCase() : '';
      return (
        payee.includes(searchLower) ||
        reasonStr.includes(searchLower) ||
        codeStr.includes(searchLower)
      );
    });
  }, [transactions, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0C0C0E] text-slate-100 flex justify-center font-sans relative overflow-x-hidden antialiased select-none">
      
      {/* Device containment Shell layout matching mockup */}
      <div className="w-full max-w-lg bg-[#121214] border-x border-[#1C1C1F] flex flex-col min-h-screen relative shadow-2xl pb-24">
        
        {/* Virtual Status Indicators */}
        <div className="px-6 pt-3 flex justify-between items-center text-[10px] font-mono text-slate-500 tracking-wider">
          <span>Safaricom 5G</span>
          <span>13:36</span>
          <div className="flex items-center gap-1">
            <span>🔋 98%</span>
          </div>
        </div>

        {/* Brand App Header */}
        <header className="p-6 pb-2 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#1B3B24] border border-[#2E7D32]/30 flex items-center justify-center font-black text-[#81C784] text-xs tracking-wide shadow-inner">
              KE
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#E2E8F0] select-none flex items-center gap-1">
                Hello, Kevin! 👋
              </h2>
              <p className="text-[10px] text-slate-500 font-mono tracking-wide">Keep up the great work!</p>
            </div>
          </div>

          {/* Quick Notification alert indicator */}
          <div className="relative">
            <button 
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="relative w-9 h-9 rounded-full bg-[#1C1C1E] border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-mono text-white flex items-center justify-center font-bold animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notification Menu Dropdown */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-3 w-72 bg-[#1C1C1E] border border-slate-800 shadow-2xl rounded-2xl p-4 z-50 text-xs text-slate-350">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                  <span className="font-bold text-slate-250 uppercase tracking-wider text-[9px] font-mono">Milestones ({notifications.length})</span>
                  <button onClick={() => setShowNotificationsDropdown(false)} className="text-[9px] text-[#81C784] hover:underline font-mono uppercase">Dismiss</button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-[9px] font-mono text-slate-500 py-4 text-center">Your budget targets are completely healthy! No limits crossed.</p>
                  ) : (
                    notifications.map((n, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-[#252529] border border-slate-800 text-[10px] leading-relaxed">
                        <p className="text-slate-300">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Security / Toggle Panel */}
        <div className="px-6 py-2 flex justify-between items-center">
          <button 
            onClick={() => setHideBalances(!hideBalances)}
            className="w-9 h-9 rounded-xl bg-[#1C1C1E] border border-slate-800/60 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Toggle Balance Privacy"
          >
            {hideBalances ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-[#81C784]" />}
          </button>

          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-[#1C1C1E] border border-slate-800 text-[11px] font-mono text-slate-400 rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:bg-slate-850"
          >
            <option value="1 Month">1 Month</option>
            <option value="3 Months">3 Months</option>
            <option value="All Time">All Time</option>
          </select>
        </div>

        {/* Summary Stat balance indicators */}
        <div className="grid grid-cols-2 gap-4 px-6 py-3">
          <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-slate-800/60 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-mono text-slate-500 block mb-1">Money In</span>
              <span className="text-[15px] font-bold font-mono text-[#81C784] tracking-wide block truncate">
                {hideBalances ? "KES ••••" : `KES ${totalMoneyIn.toLocaleString()}`}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#1C2C20] flex items-center justify-center text-[#81C784] shrink-0 border border-[#81C784]/15">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-slate-800/60 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-mono text-slate-500 block mb-1">Money Out</span>
              <span className="text-[15px] font-bold font-mono text-[#E57373] tracking-wide block truncate">
                {hideBalances ? "KES ••••" : `KES ${totalMoneyOut.toLocaleString()}`}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#351D1D] flex items-center justify-center text-[#E57373] shrink-0 border border-[#E57373]/15">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Primary View container */}
        <div className="flex-1 px-6 space-y-6">
          
          {/* A. HOME TAB VIEW (Streamlined Dashboard) */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Quick Actions Container card */}
              <div className="bg-[#1C1C1E] rounded-2xl p-5 border border-slate-800/60 space-y-4">
                <h3 className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Quick Actions</h3>
                
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setShowAddMenu(true)}
                    className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-all text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#351D1D] border border-red-500/10 flex items-center justify-center text-[#E57373] group-hover:bg-[#422222] transition-colors shadow-inner">
                      <Plus className="w-5 h-5 stroke-[3]" />
                    </div>
                    <span className="text-[10px] font-mono font-medium text-slate-400 group-hover:text-slate-200">Add Record</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-all text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#1E253A] border border-blue-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-[#2A3350] transition-colors shadow-inner">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-medium text-slate-400 group-hover:text-slate-200">Ledger</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('budget')}
                    className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-all text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#1B3222] border border-green-500/10 flex items-center justify-center text-[#81C784] group-hover:bg-[#24422E] transition-colors shadow-inner">
                      <SettingsIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-medium text-slate-400 group-hover:text-slate-200">Budgets</span>
                  </button>
                </div>
              </div>

              {/* Pending Clarification Alert (if awaiting inputs) */}
              {transactions.some(tx => tx.needsClarification) && (
                <div className="bg-[#2B2317] border border-amber-900/35 rounded-2xl p-4 space-y-2.5 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-amber-500 font-mono text-[9px] font-bold uppercase tracking-widest leading-none">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-500" /> Awaiting Clarification
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal font-sans">
                    Buddy detected transaction references waiting for details (like <span className="font-bold text-amber-500">"{transactions.find(tx => tx.needsClarification)?.recipientOrSender}"</span>). Enter what you bought so the budget remains pristine!
                  </p>
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="bg-amber-600 hover:bg-amber-500 font-mono font-bold text-[10px] text-white px-3.5 py-1.5 rounded-xl transition-all self-start cursor-pointer"
                  >
                    Set Details
                  </button>
                </div>
              )}

              {/* Recent Transactions List */}
              <div className="bg-[#1C1C1E] rounded-2xl p-5 border border-slate-800/60 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
                  <h3 className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Recent Transactions</h3>
                  <button 
                    onClick={() => setActiveTab('transactions')} 
                    className="text-[10px] font-bold text-[#81C784] hover:underline uppercase font-mono tracking-widest shrink-0"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <div 
                      key={tx.id}
                      onClick={() => {
                        if (tx.needsClarification) {
                          setActiveTab('transactions');
                        }
                      }}
                      className={`flex justify-between items-center p-2 rounded-xl transition-all ${
                        tx.needsClarification 
                        ? 'bg-[#292015] border border-amber-950/40 cursor-pointer hover:bg-[#332719]' 
                        : 'hover:bg-[#252528]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === 'income' ? 'bg-[#1C2C20]' : 'bg-[#2C2C2E]'
                        }`}>
                          <Wallet className={`w-3.5 h-3.5 ${
                            tx.type === 'income' ? 'text-[#81C784]' : 'text-slate-400'
                          }`} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#E2E8F0] tracking-wide truncate">
                            {tx.recipientOrSender}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono text-ellipsis overflow-hidden block max-w-[200px]">
                            {tx.reason} &bull; {tx.date.split(',')[0]}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <span className={`text-xs font-bold font-mono ${
                          tx.type === 'income' ? 'text-[#81C784]' : 'text-[#E57373]'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}KES {tx.amount.toLocaleString()}
                        </span>
                        {tx.needsClarification && (
                          <span className="block text-[8px] font-bold text-amber-500 font-mono tracking-widest uppercase">
                            Clarify
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly AI Insights card */}
              <div className="bg-[#1C1C1E] rounded-2xl p-5 border border-slate-800/60 space-y-4">
                <div className="flex items-center gap-2 text-slate-500 font-mono text-[9px] uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-[#81C784] animate-pulse"></span>
                  Weekly Insights ✨
                </div>
                <div className="bg-[#141416] border border-slate-900 p-4 rounded-xl space-y-3 shadow-inner">
                  <p className="text-[11px] text-slate-300 font-sans italic leading-relaxed">
                    "Heeey Kevin! Hope your week was good, na uko sawa. From what bajeti can see, it looks like your money had a super chill week – a real soft life, if you ask us! That's actually a win, maze, giving your wallet a much-needed break."
                  </p>
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-slate-500">Updated today</span>
                    <button 
                      onClick={() => setActiveTab('coach')}
                      className="text-[#81C784] hover:underline font-bold flex items-center gap-0.5 cursor-pointer text-xs"
                    >
                      Ask Buddy Coach <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Visual Spending Trends */}
              <div className="bg-[#1C1C1E] rounded-2xl p-5 border border-slate-800/60 space-y-3">
                <h3 className="text-[10px] font-mono tracking-widest text-[#81C784] uppercase">Spend Statistics</h3>
                <SpendingCharts transactions={transactions} />
              </div>

            </div>
          )}

          {/* B. TRANSACTIONS TAB VIEW (Lipa Ledger) */}
          {activeTab === 'transactions' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#1C1C1E] rounded-2xl p-5 border border-slate-800/60 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Lipa Ledger Logs</h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Filter items or refine explanations for smart advice</p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search payees, reference code..."
                    className="w-full bg-[#141416] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 outline-none focus:border-[#81C784]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredTransactions.length === 0 ? (
                  <p className="text-center py-10 font-mono text-slate-500 text-xs bg-[#1C1C1E] border border-slate-800 rounded-2xl">
                    No transactions matching your search term.
                  </p>
                ) : (
                  filteredTransactions.map((tx) => (
                    <div key={tx.id} className="bg-[#1E1E1E] rounded-xl border border-slate-800 p-1.5">
                      <TransactionRow 
                        tx={tx} 
                        onQuickClarify={(id, newReason) => {
                          handleQuickClarify(id, newReason);
                          const userSystemMsg: ChatMessage = {
                            id: `system_user_edit_${Date.now()}`,
                            sender: 'system',
                            text: `✏️ Manually clarified transaction ${tx.code}: Reason is set to "${newReason}"`,
                            timestamp: Date.now()
                          };
                          setMessages((prev) => [...prev, userSystemMsg]);
                        }} 
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* C. BUDGET TARGETS VIEW */}
          {activeTab === 'budget' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#1C1C1E] border border-slate-800 rounded-2xl p-5">
                <BudgetSettings 
                  limits={limits}
                  onChangeLimits={setLimits}
                  transactions={transactions}
                />
              </div>

              {/* Dynamic coach suggestions */}
              <div className="bg-[#1C1C1E] border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Coach Insights</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-950/20 border border-indigo-905/20 rounded-xl text-[11px] text-indigo-300 leading-relaxed">
                    <span className="font-bold text-indigo-400 block mb-0.5">💡 Savings Allocation Guideline</span>
                    Ingested logs report your wallet is doing great. Make sure to define limits for items you spent on (like "Restaurants") to avoid budget creepage.
                  </div>
                  <div className="p-3 bg-[#1C2C20]/40 border border-[#81C784]/15 rounded-xl text-[11px] text-[#81C784] leading-relaxed">
                    <span className="font-bold text-[#81C784] block mb-0.5">👍 Local Inflow Health</span>
                    Your money inflow ratio currently beats your cashout burn rate. Commute limits look stable for the cycle.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* D. SMS SIMULATION TAB */}
          {activeTab === 'simulator' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#1C1C1E] rounded-2xl border border-slate-800 p-5">
                <MpesaSimulator 
                  onNewMessageParsed={handleNewMessageParsed}
                  isLoading={isAiParsing}
                  setIsLoading={setIsAiParsing}
                />
              </div>
            </div>
          )}

          {/* E. AI ASSISTANT CHAT VIEW */}
          {activeTab === 'coach' && (
            <div className="space-y-4 animate-fade-in" id="coach_tab_view">
              <div className="bg-[#1C1C1E] rounded-2xl border border-slate-850 p-5">
                <ChatAssistant 
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isChatLoading}
                  recentTransactions={transactions}
                  budgetLimits={limits}
                  onSelectTransactionToClarify={(tx) => {
                    setActiveTab('transactions');
                  }}
                />
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM NAV BAR */}
        <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-lg bg-[#121214]/90 backdrop-blur-md border-t border-slate-800/80 grid grid-cols-5 py-2.5 z-40 select-none">
          <button 
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'home' ? 'text-[#81C784] font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <HomeIcon className="w-4 h-4" />
            <span className="text-[9px] font-mono">Home</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'transactions' ? 'text-[#81C784] font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span className="text-[9px] font-mono">Ledger</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'budget' ? 'text-[#81C784] font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="text-[9px] font-mono">Budget</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'simulator' ? 'text-[#81C784] font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-[9px] font-mono">Sandbox</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('coach')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeTab === 'coach' ? 'text-[#81C784] font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span className="text-[9px] font-mono">Coach</span>
          </button>
        </nav>

        {/* MODAL DRAWER FOR RECORD ADDITION */}
        {showAddMenu && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-end justify-center z-50 p-4 animate-fade-in" id="add-menu-drawer">
            <div className="bg-[#1C1C1E] border border-slate-800 rounded-t-3xl w-full max-w-lg overflow-hidden pb-8 relative shadow-2xl p-6">
              
              <button 
                onClick={() => setShowAddMenu(false)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[#2C2C2E] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-sm font-bold text-white mb-0.5">Log Ledger Record</h3>
              <p className="text-[10px] font-mono text-slate-500 mb-6">Enter a manual expense/income context</p>

              <form onSubmit={handleManualAddSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[8px] font-mono uppercase tracking-widest text-slate-500 mb-1">Type</label>
                    <select
                      value={manualType}
                      onChange={(e) => setManualType(e.target.value as any)}
                      className="w-full bg-[#141416] border border-slate-800 text-xs text-slate-350 rounded-xl p-2.5 outline-none cursor-pointer"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] font-mono uppercase tracking-widest text-slate-500 mb-1">Amount (KES)</label>
                    <input
                      type="number"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full bg-[#141416] border border-slate-800 text-xs text-slate-300 rounded-xl p-2.5 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-mono uppercase tracking-widest text-slate-500 mb-1">Payee / Recipient / Sender</label>
                  <input
                    type="text"
                    value={manualRecipient}
                    onChange={(e) => setManualRecipient(e.target.value)}
                    placeholder="e.g. KFC Till, Super Metro"
                    className="w-full bg-[#141416] border border-slate-800 text-xs text-slate-350 rounded-xl p-2.5 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-mono uppercase tracking-widest text-slate-500 mb-1">Reason / Note details</label>
                  <input
                    type="text"
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    placeholder="e.g. Coffee breakout, weekly commuting ticket"
                    className="w-full bg-[#141416] border border-slate-800 text-xs text-slate-350 rounded-xl p-2.5 outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#2E7D32] hover:bg-[#25632A] text-white rounded-xl text-xs font-bold transition-all mt-4 cursor-pointer"
                >
                  Log Transaction
                </button>
              </form>

              <div className="border-t border-slate-800/85 mt-6 pt-4 text-center">
                <span className="text-[10px] font-mono text-slate-500 block mb-1">Want to test automated AI parser instead?</span>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddMenu(false);
                    setActiveTab('simulator');
                  }}
                  className="text-xs text-[#81C784] hover:underline font-bold uppercase font-mono tracking-wider cursor-pointer"
                >
                  🚀 Use SMS Sandbox
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
