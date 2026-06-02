// lib/screens/dashboard_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/finance_provider.dart';

class DashboardScreen extends StatelessWidget {
  final VoidCallback onNavigateToLedger;
  final VoidCallback onNavigateToBudget;
  final VoidCallback onNavigateToCoach;

  const DashboardScreen({
    Key? key,
    required this.onNavigateToLedger,
    required this.onNavigateToBudget,
    required this.onNavigateToCoach,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final finance = Provider.of<FinanceProvider>(context);
    final theme = Theme.of(context);

    final needsClarify = finance.transactions.where((tx) => tx.needsClarification).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.crossAxisAlignment,
        children: [
          // Greeting Heading
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Hello, Kevin! 👋",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    "Keep up the great work!",
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[500],
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
              IconButton(
                onPressed: finance.toggleHideBalances,
                icon: Icon(
                  finance.hideBalances ? Icons.visibility_off : Icons.visibility,
                  color: const Color(0xFF81C784),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Total Stat Cards
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1C1C1E),
                    borderRadius: BorderRadius.circular(16.0),
                    border: Border.all(color: Colors.grey[900]!),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "Money In",
                              style: TextStyle(fontSize: 10, color: Colors.grey, fontFamily: 'monospace'),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              finance.hideBalances ? "KES ••••" : "KES ${finance.totalIncome.toStringAsFixed(0)}",
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF81C784),
                                fontFamily: 'monospace',
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1C2C20),
                          borderRadius: BorderRadius.circular(50),
                        ),
                        child: const Icon(Icons.arrow_upward, size: 16, color: Color(0xFF81C784)),
                      )
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1C1C1E),
                    borderRadius: BorderRadius.circular(16.0),
                    border: Border.all(color: Colors.grey[900]!),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "Money Out",
                              style: TextStyle(fontSize: 10, color: Colors.grey, fontFamily: 'monospace'),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              finance.hideBalances ? "KES ••••" : "KES ${finance.totalExpenses.toStringAsFixed(0)}",
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFE57373),
                                fontFamily: 'monospace',
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF351D1D),
                          borderRadius: BorderRadius.circular(50),
                        ),
                        child: const Icon(Icons.arrow_downward, size: 16, color: Color(0xFFE57373)),
                      )
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Cash Burn Rate Slider Gauge
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: const Color(0xFF1C1C1E),
              borderRadius: BorderRadius.circular(16.0),
              border: Border.all(color: Colors.grey[900]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    const Text(
                      "Ledger Cash-burn Rate",
                      style: TextStyle(fontSize: 11, color: Colors.grey, fontFamily: 'monospace'),
                    ),
                    Text(
                      "${finance.burnRatePercent.toStringAsFixed(0)}% Spent",
                      style: TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: finance.burnRatePercent > 90 ? const Color(0xFFE57373) : const Color(0xFF81C784),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: LinearProgressIndicator(
                    value: finance.burnRatePercent / 100.0,
                    minHeight: 8,
                    backgroundColor: const Color(0xFF141416),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      finance.burnRatePercent > 90 ? const Color(0xFFE47373) : const Color(0xFF81C784),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Alert banner if details missing
          if (needsClarify.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                color: const Color(0xFF2B2317),
                borderRadius: BorderRadius.circular(16.0),
                border: Border.all(color: Colors.amber[900]!.withOpacity(0.35)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.star, size: 16, color: Colors.amber),
                      SizedBox(width: 8),
                      Text(
                        "AWAITING CLARIFICATION",
                        style: TextStyle(fontSize: 10, fontFamily: 'monospace', color: Colors.amber, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Buddy detected ${needsClarify.length} transactions waiting for details (like \"${needsClarify.first.recipientOrSender}\"). Enter what you bought so the budget remains pristine!",
                    style: const TextStyle(fontSize: 11, color: Colors.white70, height: 1.4),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.amber[700],
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    ),
                    onPressed: onNavigateToLedger,
                    child: const Text("Set Details", style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 20),

          // Recent Ledger logs list
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              const Text(
                "RECENT TRANSACTIONS",
                style: TextStyle(fontSize: 10, fontFamily: 'monospace', color: Colors.grey, fontWeight: FontWeight.bold),
              ),
              TextButton(
                onPressed: onNavigateToLedger,
                child: const Text("VIEW ALL", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF81C784))),
              )
            ],
          ),
          const SizedBox(height: 10),

          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: finance.transactions.length.clamp(0, 5),
            itemBuilder: (context, index) {
              final tx = finance.transactions[index];
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: tx.needsClarification ? const Color(0xFF292015) : const Color(0xFF1C1C1E),
                  borderRadius: BorderRadius.circular(12.0),
                  border: Border.all(
                    color: tx.needsClarification ? Colors.amber[900]!.withOpacity(0.3) : Colors.transparent,
                  ),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: tx.type == 'income' ? const Color(0xFF1C2C20) : const Color(0xFF2C2C2E),
                      child: Icon(
                        tx.type == 'income' ? Icons.wallet : Icons.payment,
                        color: tx.type == 'income' ? const Color(0xFF81C784) : Colors.grey[400],
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            tx.recipientOrSender,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 3),
                          Text(
                            tx.reason,
                            style: TextStyle(fontSize: 10, color: Colors.grey[400]),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          "${tx.type == 'income' ? '+' : '-'} KES ${tx.amount.toStringAsFixed(0)}",
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'monospace',
                            color: tx.type == 'income' ? const Color(0xFF81C784) : const Color(0xFFE57373),
                          ),
                        ),
                        if (tx.needsClarification)
                          const Text(
                            "CLARIFY",
                            style: TextStyle(fontSize: 8, color: Colors.amber, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                          ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 10),

          // Weekly AI insights simulation
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: const Color(0xFF1C1C1E),
              borderRadius: BorderRadius.circular(16.0),
              border: Border.all(color: Colors.grey[900]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    CircleAvatar(radius: 4, backgroundColor: Color(0xFF81C784)),
                    SizedBox(width: 8),
                    Text(
                      "WEEKLY INSIGHTS ✨",
                      style: TextStyle(fontSize: 9, fontFamily: 'monospace', color: Colors.grey),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const Text(
                  "\"Heeey Kevin! From what your budget coach can see, your wallet survived the weekly trips quite nicely with a super chill commute cycle. That savings ratio is fully ready for investment allocations!\"",
                  style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Colors.white75, height: 1.4),
                ),
                const SizedBox(height: 12),
                InkWell(
                  onTap: onNavigateToCoach,
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Ask Buddy Coach", style: TextStyle(color: Color(0xFF81C784), fontSize: 11, fontWeight: FontWeight.bold)),
                      Icon(Icons.chevron_right, size: 16, color: Color(0xFF81C784)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
