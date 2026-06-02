// lib/models/transaction.dart

class Transaction {
  final String id;
  final String code;
  final double amount;
  final String type; // 'income' or 'expense'
  final String recipientOrSender;
  final String date;
  final String time;
  final String reason;
  final bool needsClarification;
  final int timestamp;

  Transaction({
    required this.id,
    required this.code,
    required this.amount,
    required this.type,
    required this.recipientOrSender,
    required this.date,
    required this.time,
    required this.reason,
    required this.needsClarification,
    required this.timestamp,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      type: json['type'] ?? 'expense',
      recipientOrSender: json['recipientOrSender'] ?? '',
      date: json['date'] ?? '',
      time: json['time'] ?? '10:00 AM',
      reason: json['reason'] ?? '',
      needsClarification: json['needsClarification'] ?? true,
      timestamp: json['timestamp'] ?? DateTime.now().millisecondsSinceEpoch,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'amount': amount,
      'type': type,
      'recipientOrSender': recipientOrSender,
      'date': date,
      'time': time,
      'reason': reason,
      'needsClarification': needsClarification,
      'timestamp': timestamp,
    };
  }

  Transaction copyWith({
    String? id,
    String? code,
    double? amount,
    String? type,
    String? recipientOrSender,
    String? date,
    String? time,
    String? reason,
    bool? needsClarification,
    int? timestamp,
  }) {
    return Transaction(
      id: id ?? this.id,
      code: code ?? this.code,
      amount: amount ?? this.amount,
      type: type ?? this.type,
      recipientOrSender: recipientOrSender ?? this.recipientOrSender,
      date: date ?? this.date,
      time: time ?? this.time,
      reason: reason ?? this.reason,
      needsClarification: needsClarification ?? this.needsClarification,
      timestamp: timestamp ?? this.timestamp,
    );
  }
}
