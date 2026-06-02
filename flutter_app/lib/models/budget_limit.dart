// lib/models/budget_limit.dart

class BudgetLimit {
  final String keyword;
  final double limit;

  BudgetLimit({
    required this.keyword,
    required this.limit,
  });

  factory BudgetLimit.fromJson(Map<String, dynamic> json) {
    return BudgetLimit(
      keyword: json['keyword'] ?? 'Other',
      limit: (json['limit'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'keyword': keyword,
      'limit': limit,
    };
  }
}
