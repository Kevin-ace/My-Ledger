// lib/screens/ledger_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/finance_provider.dart';
import '../models/transaction.dart';

class LedgerScreen extends StatefulWidget {
  const LedgerScreen({Key? key}) : super(key: key);

  @override
  State<LedgerScreen> createState() => _LedgerScreenState();
}

class _LedgerScreenState extends State<LedgerScreen> {
  String _searchQuery = "";

  @override
  Widget build(BuildContext context) {
    final finance = Provider.of<FinanceProvider>(context);
    final theme = Theme.of(context);

    final filtered = finance.transactions.where((tx) {
      final term = _searchQuery.toLowerCase();
      final payee = tx.recipientOrSender.toLowerCase();
      final reason = tx.reason.toLowerCase();
      final code = tx.code.toLowerCase();
      return payee.contains(term) || reason.contains(term) || code.contains(term);
    }).toList();

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header description
          const Text(
            "Lipa Ledger Logs",
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 2),
          Text(
            "Filter items or refine explanations for smart advice",
            style: TextStyle(fontSize: 10, fontFamily: 'monospace', color: Colors.grey[500]),
          ),
          const SizedBox(height: 16),

          // Search Field
          TextField(
            onChanged: (val) {
              setState(() {
                _searchQuery = val;
              });
            },
            style: const TextStyle(color: Colors.white, fontSize: 12),
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.search, size: 16, color: Colors.grey),
              hintText: "Search payees, reference code...",
              hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
              filled: true,
              fillColor: const Color(0xFF141416),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
          const SizedBox(height: 20),

          // Transaction Items
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Text(
                      "No transactions matching your search term.",
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 11, fontFamily: 'monospace', color: Colors.grey[600]),
                    ),
                  )
                : ListView.builder(
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final tx = filtered[index];
                      return LedgerRowItem(tx: tx);
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class LedgerRowItem extends StatefulWidget {
  final Transaction tx;
  const LedgerRowItem({Key? key, required this.tx}) : super(key: key);

  @override
  State<LedgerRowItem> createState() => _LedgerRowItemState();
}

class _LedgerRowItemState extends State<LedgerRowItem> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.tx.reason);
  }

  @override
  void didUpdateWidget(covariant LedgerRowItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.tx.reason != widget.tx.reason) {
      _controller.text = widget.tx.reason;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final finance = Provider.of<FinanceProvider>(context, listen: false);
    final tx = widget.tx;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: tx.needsClarification ? const Color(0xFF292015) : const Color(0xFF1C1C1E),
        borderRadius: BorderRadius.circular(16.0),
        border: Border.all(
          color: tx.needsClarification ? Colors.amber[900]!.withOpacity(0.4) : Colors.grey[900]!,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              // Code and Merchant row
              Expanded(
                child: Row(
                  children: [
                    Text(
                      tx.code,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10, fontFamily: 'monospace', color: Color(0xFF81C784)),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        tx.recipientOrSender,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                "${tx.type == 'income' ? '+' : '-'} KES ${tx.amount.toStringAsFixed(0)}",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: tx.type == 'income' ? const Color(0xFF81C784) : const Color(0xFFE57373),
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            tx.date,
            style: TextStyle(fontSize: 8, color: Colors.grey[600], fontFamily: 'monospace'),
          ),
          const SizedBox(height: 12),

          // Reason editing field
          const Text(
            "REASON / PURPOSE",
            style: TextStyle(fontSize: 8, fontFamily: 'monospace', color: Colors.grey, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 36,
                  child: TextField(
                    controller: _controller,
                    style: const TextStyle(color: Colors.white, fontSize: 11),
                    decoration: InputDecoration(
                      hintText: "What specifically did you buy here?",
                      hintStyle: TextStyle(color: Colors.grey[600], fontSize: 11),
                      filled: true,
                      fillColor: const Color(0xFF141416),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey[900]!),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey[900]!),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF81C784)),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              if (tx.reason != _controller.text || tx.needsClarification)
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2E7D32),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    minimumSize: Size.zero,
                  ),
                  onPressed: () {
                    finance.updateTransactionReason(tx.id, _controller.text);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text("Transaction details updated!"),
                        duration: Duration(seconds: 1),
                      ),
                    );
                    setState(() {});
                  },
                  child: const Text("SAVE", style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
