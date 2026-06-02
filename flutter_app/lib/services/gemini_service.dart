// lib/services/gemini_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/transaction.dart';

class GeminiService {
  // If integrating directly client-side or pointing to your hosted Node server backend:
  final String baseUrl;
  
  GeminiService({this.baseUrl = 'http://localhost:3000/api'});

  /// Calls the GPT/Gemini parser to digest a raw M-Pesa SMS
  Future<Transaction?> parseSms(String smsContent) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/parse-sms'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'text': smsContent}),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        if (data['success'] == true) {
          return Transaction(
            id: 'TX_${DateTime.now().microsecondsSinceEpoch}',
            code: data['code'] ?? 'M_SMS_PARSE',
            amount: (data['amount'] as num?)?.toDouble() ?? 0.0,
            type: data['type'] ?? 'expense',
            recipientOrSender: data['recipientOrSender'] ?? 'Lipa na M-Pesa Merchant',
            date: data['date'] ?? 'June 2, 2026',
            time: data['time'] ?? '10:00 AM',
            reason: data['reason'] ?? 'Parsed SMS log',
            needsClarification: data['needsClarification'] ?? true,
            timestamp: DateTime.now().millisecondsSinceEpoch,
          );
        }
      }
    } catch (e) {
      print('Sms parsing failed: $e');
    }
    return null;
  }

  /// Sends a message history to the witty Budget Coach
  Future<Map<String, dynamic>?> chatWithCoach({
    required String message,
    required List<Map<String, dynamic>> history,
    required List<Transaction> recentTransactions,
    required List<dynamic> budgetLimits,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/chat-assistant'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'message': message,
          'history': history,
          'context': {
            'recentTransactions': recentTransactions.map((tx) => tx.toJson()).toList(),
            'budgetLimits': budgetLimits,
          }
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print('Agent request break: $e');
    }
    return null;
  }
}
