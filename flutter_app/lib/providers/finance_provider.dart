// lib/providers/finance_provider.dart

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/transaction.dart';
import '../models/budget_limit.dart';

class FinanceProvider with ChangeNotifier {
  List<Transaction> _transactions = [];
  List<BudgetLimit> _limits = [];
  bool _hideBalances = false;

  List<Transaction> get transactions => _transactions;
  List<BudgetLimit> get limits => _limits;
  bool get hideBalances => _hideBalances;

  double get totalIncome {
    return _transactions
        .where((t) => t.type == 'income')
        .fold(0.0, (sum, t) => sum + t.amount);
  }

  double get totalExpenses {
    return _transactions
        .where((t) => t.type == 'expense')
        .fold(0.0, (sum, t) => sum + t.amount);
  }

  double get burnRatePercent {
    final income = totalIncome;
    if (income <= 0) return 100.0;
    return (totalExpenses / income * 100).clamp(0.0, 100.0);
  }

  FinanceProvider() {
    _loadFromStorage();
  }

  void toggleHideBalances() {
    _hideBalances = !_hideBalances;
    notifyListeners();
  }

  // Calculate specific spent amounts matching a case-insensitive keyword
  double getSpendForKeyword(String keyword) {
    final term = keyword.toLowerCase().trim();
    if (term.isEmpty) return 0.0;
    
    return _transactions.where((tx) {
      if (tx.type != 'expense') return false;
      final payee = tx.recipientOrSender.toLowerCase();
      final reason = tx.reason.toLowerCase();
      return payee.contains(term) || reason.contains(term);
    }).fold(0.0, (sum, tx) => sum + tx.amount);
  }

  // Load state from local shared preferences
  Future<void> _loadFromStorage() async {
    final prefs = await SharedPreferences.getInstance();
    
    // Load Transactions
    final txString = prefs.getString('mpesa_transactions');
    if (txString != null) {
      try {
        final List<dynamic> list = json.decode(txString);
        _transactions = list.map((item) => Transaction.fromJson(item)).toList();
      } catch (e) {
        _setDefaults();
      }
    } else {
      _setDefaults();
    }

    // Load limits
    final limitsString = prefs.getString('mpesa_limits');
    if (limitsString != null) {
      try {
        final List<dynamic> list = json.decode(limitsString);
        _limits = list.map((item) => BudgetLimit.fromJson(item)).toList();
      } catch (e) {
        _setLimitDefaults();
      }
    } else {
      _setLimitDefaults();
    }
    notifyListeners();
  }

  void _setDefaults() {
    _transactions = [
      Transaction(
        id: "MP_TR1",
        code: "QFH112PE7F",
        amount: 6800.0,
        type: "expense",
        recipientOrSender: "NAIVAS SUPERMARKET",
        date: "June 1, 2026",
        time: "6:45 PM",
        reason: "Family grocery shopping trip",
        needsClarification: false,
        timestamp: DateTime.now().millisecondsSinceEpoch - 24 * 3600 * 1000,
      ),
      Transaction(
        id: "MP_TR2",
        code: "QDL523RE4M",
        amount: 1500.0,
        type: "expense",
        recipientOrSender: "CJ'S RESTAURANT",
        date: "June 2, 2026",
        time: "1:12 PM",
        reason: "Clarify: Lunch details or meeting note",
        needsClarification: true,
        timestamp: DateTime.now().millisecondsSinceEpoch - 2 * 3600 * 1000,
      ),
      Transaction(
        id: "MP_TR3",
        code: "QWE123RTY5",
        amount: 120000.0,
        type: "income",
        recipientOrSender: "ALPHATECH LOGISTICS",
        date: "May 30, 2026",
        time: "8:00 AM",
        reason: "Monthly salary payout",
        needsClarification: false,
        timestamp: DateTime.now().millisecondsSinceEpoch - 3 * 24 * 3600 * 1000,
      ),
      Transaction(
        id: "MP_TR4",
        code: "QDF125TY9O",
        amount: 250.0,
        type: "expense",
        recipientOrSender: "SUPER METRO TILL",
        date: "June 2, 2026",
        time: "7:30 AM",
        reason: "Clarify: Route or trip commute details",
        needsClarification: true,
        timestamp: DateTime.now().millisecondsSinceEpoch - 8 * 3600 * 1000,
      ),
    ];
    _saveTransactions();
  }

  void _setLimitDefaults() {
    _limits = [
      BudgetLimit(keyword: "Naivas", limit: 30000.0),
      BudgetLimit(keyword: "Metro", limit: 5000.0),
      BudgetLimit(keyword: "Restaurant", limit: 10000.0),
    ];
    _saveLimits();
  }

  // Save State
  Future<void> _saveTransactions() async {
    final prefs = await SharedPreferences.getInstance();
    final data = _transactions.map((tx) => tx.toJson()).toList();
    await prefs.setString('mpesa_transactions', json.encode(data));
  }

  Future<void> _saveLimits() async {
    final prefs = await SharedPreferences.getInstance();
    final data = _limits.map((l) => l.toJson()).toList();
    await prefs.setString('mpesa_limits', json.encode(data));
  }

  // Core mutation functions
  void addTransaction(Transaction tx) {
    _transactions.insert(0, tx);
    _saveTransactions();
    notifyListeners();
  }

  void updateTransactionReason(String id, String newReason) {
    _transactions = _transactions.map((tx) {
      if (tx.id == id) {
        return tx.copyWith(reason: newReason, needsClarification: false);
      }
      return tx;
    }).toList();
    _saveTransactions();
    notifyListeners();
  }

  void updateLimit(String keyword, double limitVal) {
    final exists = _limits.any((l) => l.keyword.toLowerCase() == keyword.toLowerCase());
    if (exists) {
      _limits = _limits.map((l) {
        if (l.keyword.toLowerCase() == keyword.toLowerCase()) {
          return BudgetLimit(keyword: l.keyword, limit: limitVal);
        }
        return l;
      }).toList();
    } else {
      _limits.add(BudgetLimit(keyword: keyword, limit: limitVal));
    }
    _saveLimits();
    notifyListeners();
  }

  void removeLimit(String keyword) {
    _limits.removeWhere((l) => l.keyword == keyword);
    _saveLimits();
    notifyListeners();
  }
}
