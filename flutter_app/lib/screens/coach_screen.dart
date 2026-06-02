// lib/screens/coach_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/finance_provider.dart';
import '../services/gemini_service.dart';

class CoachScreen extends StatefulWidget {
  const CoachScreen({Key? key}) : super(key: key);

  @override
  State<CoachScreen> createState() => _CoachScreenState();
}

class _CoachScreenState extends State<CoachScreen> {
  final List<Map<String, String>> _messages = [
    {
      'sender': 'assistant',
      'text': 'Heeey Kevin! Ready to audit your M-Pesa ledger? 🇰🇪\n\nI am your companion financial buddy. Click on an unconfirmed transaction to clarify what you bought, or type below for dynamic advice!'
    }
  ];
  final _controller = TextEditingController();
  final _geminiService = GeminiService();
  bool _isLoading = false;

  void _sendMessage(String text) async {
    if (text.trim().isEmpty) return;
    _controller.clear();

    setState(() {
      _messages.add({'sender': 'user', 'text': text});
      _isLoading = true;
    });

    final finance = Provider.of<FinanceProvider>(context, listen: false);

    // Formulate a clean format history
    final historyList = _messages.map((m) => {
      'sender': m['sender']!,
      'text': m['text']!
    }).toList();

    final response = await _geminiService.chatWithCoach(
      message: text,
      history: historyList,
      recentTransactions: finance.transactions,
      budgetLimits: finance.limits.map((l) => {'keyword': l.keyword, 'limit': l.limit}).toList(),
    );

    setState(() {
      _isLoading = false;
    });

    if (response != null && response['text'] != null) {
      setState(() {
        _messages.add({'sender': 'assistant', 'text': response['text']});
      });

      // Execute dynamic automated corrections passed from the server Action block
      if (response['action'] != null) {
        final action = response['action'];
        if (action['type'] == 'update_transaction') {
          final txIdOrCode = action['transactionId'];
          final updates = action['updates'];
          if (updates != null && updates['reason'] != null) {
            finance.updateTransactionReason(txIdOrCode, updates['reason']);
            setState(() {
              _messages.add({
                'sender': 'system',
                'text': '⚙️ Updated transaction code ($txIdOrCode) with reason: "${updates['reason']}"'
              });
            });
          }
        } else if (action['type'] == 'add_budget_limit') {
          final updates = action['updates'];
          if (updates != null && updates['keyword'] != null && updates['limit'] != null) {
            final double val = (updates['limit'] as num).toDouble();
            finance.updateLimit(updates['keyword'], val);
            setState(() {
              _messages.add({
                'sender': 'system',
                'text': '⚙️ Created alert limit keyword: "${updates['keyword']}" capped at KES ${val.toStringAsFixed(0)}'
              });
            });
          }
        }
      }
    } else {
      setState(() {
        _messages.add({
          'sender': 'system',
          'text': '⚠️ Coach Connection Stale. Please make sure your server.ts and GEMINI_API_KEY environment is active.'
        });
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Coach Title Banner
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          border: Border(bottom: BorderSide(color: Colors.grey[900]!)),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: const Color(0xFF1B3B24),
                child: Text(
                  "KE",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.green[400]),
                ),
              ),
              const SizedBox(width: 12),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("M-Ledger Buddy coach", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white)),
                  Text("Online — ready to audit your budget!", style: TextStyle(fontSize: 9, color: Colors.green, fontFamily: 'monospace')),
                ],
              ),
            ],
          ),
        ),

        // Message Items List
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _messages.length,
            itemBuilder: (context, index) {
              final m = _messages[index];
              final isUser = m['sender'] == 'user';
              final isSystem = m['sender'] == 'system';

              if (isSystem) {
                return Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    margin: const EdgeInsets.symmetric(vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF141416),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      m['text']!,
                      style: TextStyle(fontSize: 10, fontFamily: 'monospace', color: Colors.grey[500]),
                    ),
                  ),
                );
              }

              return Align(
                alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  maxCrossAxisExtent: MediaQuery.of(context).size.width * 0.75,
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isUser ? const Color(0xFF2E7D32) : const Color(0xFF1C1C1E),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isUser ? 16 : 0),
                      bottomRight: Radius.circular(isUser ? 0 : 16),
                    ),
                    border: Border.all(color: isUser ? Colors.transparent : Colors.grey[900]!),
                  ),
                  child: Text(
                    m['text']!,
                    style: TextStyle(
                      color: isUser ? Colors.white : Colors.slate[200],
                      fontSize: 11,
                      height: 1.4,
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        // Core suggestions items bar
        if (_messages.length == 1)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Wrap(
              spacing: 8,
              children: [
                ActionChip(
                  label: const Text("How do my budgets look?", style: TextStyle(fontSize: 9, color: Colors.white)),
                  backgroundColor: const Color(0xFF1C1C1E),
                  onPressed: () => _sendMessage("How do my budgets look?"),
                ),
                ActionChip(
                  label: const Text("Any overspending advice?", style: TextStyle(fontSize: 9, color: Colors.white)),
                  backgroundColor: const Color(0xFF1C1C1E),
                  onPressed: () => _sendMessage("Are there any spots of overspending?"),
                ),
              ],
            ),
          ),

        // Typing Loader Row Indicator
        if (_isLoading)
          const Padding(
            padding: EdgeInsets.all(8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(strokeWidth: 1.5, color: Color(0xFF81C784)),
                ),
                SizedBox(width: 8),
                Text("Buddy is thinking...", style: TextStyle(fontSize: 9, fontFamily: 'monospace', color: Colors.grey)),
              ],
            ),
          ),

        // Text entry send row
        Container(
          padding: const EdgeInsets.all(12),
          border: Border(top: BorderSide(color: Colors.grey[900]!)),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  height: 40,
                  child: TextField(
                    controller: _controller,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    onSubmitted: _sendMessage,
                    decoration: InputDecoration(
                      hintText: "Enter explanation or ask a budget tip...",
                      hintStyle: TextStyle(color: Colors.grey[600], fontSize: 11),
                      filled: true,
                      fillColor: const Color(0xFF141416),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                style: IconButton.styleFrom(
                  backgroundColor: const Color(0xFF2E7D32),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () => _sendMessage(_controller.text),
                icon: const Icon(Icons.send, size: 16, color: Colors.white),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
