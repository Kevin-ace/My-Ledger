// lib/screens/budget_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/finance_provider.dart';
import '../models/budget_limit.dart';

class BudgetScreen extends StatefulWidget {
  const BudgetScreen({Key? key}) : super(key: key);

  @override
  State<BudgetScreen> createState() => _BudgetScreenState();
}

class _BudgetScreenState extends State<BudgetScreen> {
  bool _isAdding = false;
  final _keywordController = TextEditingController();
  final _limitController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final finance = Provider.of<FinanceProvider>(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Setup Row
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Dynamic Budget Alerts",
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    "Define tracking keywords to target spend limits",
                    style: TextStyle(fontSize: 10, fontFamily: 'monospace', color: Colors.grey[500]),
                  ),
                ],
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2E7D32),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                onPressed: () {
                  setState(() {
                    _isAdding = !_isAdding;
                  });
                },
                icon: Icon(_isAdding ? Icons.close : Icons.add, size: 14, color: Colors.white),
                label: Text(
                  _isAdding ? "CANCEL" : "SET LIMIT",
                  style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Add limit form drawer item
          if (_isAdding) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF141416),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey[900]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "KEYWORD / LABEL",
                              style: TextStyle(fontSize: 8, fontFamily: 'monospace', color: Colors.grey),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              height: 38,
                              child: TextField(
                                controller: _keywordController,
                                style: const TextStyle(color: Colors.white, fontSize: 12),
                                decoration: InputDecoration(
                                  hintText: "e.g. Naivas, Metro",
                                  hintStyle: TextStyle(color: Colors.grey[600], fontSize: 11),
                                  filled: true,
                                  fillColor: const Color(0xFF1C1C1E),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                  contentPadding: const EdgeInsets.all(10),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "LIMIT (KES)",
                              style: TextStyle(fontSize: 8, fontFamily: 'monospace', color: Colors.grey),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              height: 38,
                              child: TextField(
                                controller: _limitController,
                                keyboardType: TextInputType.number,
                                style: const TextStyle(color: Colors.white, fontSize: 12),
                                decoration: InputDecoration(
                                  hintText: "e.g. 15000",
                                  hintStyle: TextStyle(color: Colors.grey[600], fontSize: 11),
                                  filled: true,
                                  fillColor: const Color(0xFF1C1C1E),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                  contentPadding: const EdgeInsets.all(10),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 38,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2E7D32),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () {
                        final kw = _keywordController.text.trim();
                        final val = double.tryParse(_limitController.text) ?? 0.0;
                        if (kw.isNotEmpty && val > 0) {
                          finance.updateLimit(kw, val);
                          _keywordController.clear();
                          _limitController.clear();
                          setState(() {
                            _isAdding = false;
                          });
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Budget limit created!"), duration: Duration(seconds: 1)),
                          );
                        }
                      },
                      child: const Text("Create Alert Tag", style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],

          // Limits listing
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: finance.limits.length,
            itemBuilder: (context, index) {
              final limit = finance.limits[index];
              final currentSpend = finance.getSpendForKeyword(limit.keyword);
              final progress = limit.limit > 0 ? (currentSpend / limit.limit) : 0.0;
              final isExceeded = currentSpend > limit.limit;
              final isNearing = progress >= 0.8 && !isExceeded;

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isExceeded
                      ? const Color(0xFF351D1D)
                      : isNearing
                          ? const Color(0xFF292015)
                          : const Color(0xFF1C1C1E),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isExceeded
                        ? Colors.red[950]!
                        : isNearing
                            ? Colors.amber[950]!
                            : Colors.grey[900]!,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Matches: \"${limit.keyword}\"",
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF81C784)),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              "Spent: KES ${currentSpend.toStringAsFixed(0)} of ${limit.limit.toStringAsFixed(0)}",
                              style: TextStyle(fontSize: 10, fontFamily: 'monospace', color: Colors.grey[400]),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, size: 16, color: Colors.grey),
                          onPressed: () {
                            finance.removeLimit(limit.keyword);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text("Limit deleted!"), duration: Duration(seconds: 1)),
                            );
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Progress bar
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: LinearProgressIndicator(
                        value: progress.clamp(0.0, 1.0),
                        minHeight: 6,
                        backgroundColor: const Color(0xFF141416),
                        valueColor: AlwaysStoppedAnimation<Color>(
                          isExceeded
                              ? Colors.red
                              : isNearing
                                  ? Colors.amber
                                  : const Color(0xFF10B981),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Status Indicator Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        Row(
                          children: [
                            Icon(
                              isExceeded
                                  ? Icons.security_sharp
                                  : isNearing
                                      ? Icons.info_outline
                                      : Icons.check_circle_outline,
                              size: 11,
                              color: isExceeded
                                  ? Colors.red
                                  : isNearing
                                      ? Colors.amber
                                      : const Color(0xFF81C784),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              isExceeded
                                  ? "EXCEEDED!"
                                  : isNearing
                                      ? "Nearing cap (${(progress * 100).toStringAsFixed(0)}%)"
                                      : "Safe (${(progress * 100).toStringAsFixed(0)}%)",
                              style: TextStyle(
                                fontSize: 9,
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                                color: isExceeded
                                    ? Colors.red
                                    : isNearing
                                        ? Colors.amber
                                        : const Color(0xFF81C784),
                              ),
                            ),
                          ],
                        ),
                        Text(
                          isExceeded
                              ? "Limit Exceeded"
                              : "${((1.0 - progress) * 100).clamp(0, 100).toStringAsFixed(0)}% remaining",
                          style: TextStyle(fontSize: 9, fontFamily: 'monospace', color: Colors.grey[500]),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
