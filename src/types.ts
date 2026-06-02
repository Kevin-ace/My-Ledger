/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  id: string;
  code: string; // Mpesa reference code (e.g. QWE123RTY4)
  amount: number;
  type: 'income' | 'expense';
  recipientOrSender: string; // Recipient business or sender name
  date: string; // Readable transaction date
  time?: string; // Transaction time
  reason: string; // Specific reason/purpose description, understood directly by AI
  needsClarification: boolean; // True if awaiting clarification
  timestamp: number; // For sorting
}

export interface BudgetLimit {
  keyword: string; // keyword or label to match against reason or payee name (e.g. "Naivas", "Metro")
  limit: number;
}

export interface MpesaMessage {
  id: string;
  text: string;
  timestamp: number;
  parsed: boolean;
  transactionCode?: string;
}

export interface SystemNotification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  timestamp: number;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
}
