// lib/screens/simulator_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/finance_provider.dart';
import '../services/gemini_service.dart';
import '../models/transaction.dart';

class SimulatorScreen extends StatefulWidget {
  final VoidCallback onParseSuccess;
  const SimulatorScreen({Key? key, required this.onParseSuccess}) : super(key: key);

  @override
  State<SimulatorScreen> createState() => _SimulatorScreenState();
}

class _SimulatorScreenState extends State<SimulatorScreen> {
  final _smsController = TextEditingController();
  final _geminiService = GeminiService();
  bool _isLoading = false;

  final List<String> _mocks = [
    "QFH112PE7F Confirmed. Ksh 6,800.00 paid to NAIVAS SUPERMARKET. on 1/6/26 at 6:45 PM. New M-PESA balance KES 14,200. Transaction cost KES 25.00.",
    "QWE778TRP2 Confirmed. Ksh 2,000.00 sent to JENNIFER WAITHRA on 2/6/26 at 9:00 AM.",
    "QDL523RE4M Confirmed. KES 1,500.00 paid to CJ'S RESTAURANT."
  ];

  void _runParser(String smsText) async {
    if (smsText.trim().isEmpty) return;

    setState(() {
      _isLoading = true;
    });

    final tx = await _geminiService.parseSms(smsText);

    setState(() {
      _isLoading = false;
    });

    if (tx != null) {
      final finance = Provider.of<FinanceProvider>(context, listen: false);
      finance.addTransaction(tx);
      _smsController.clear();
      widget.onParseSuccess();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Parsed Code ${tx.code} and logged successfully!")),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Failed to parse. Is the node server.ts active?")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header descriptive notes
          const Text(
            "SMS Simulation Sandbox",
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 2),
          Text(
            "Automate ledger ingests using mock incoming notifications",
            style: TextStyle(fontSize: 10, fontFamily: 'monospace', color: Colors.grey[500]),
          ),
          const SizedBox(height: 16),

          // Presets
          const Text(
            "CHOOSE A SAFARICOM M-PESA SMS RECIPIENT PRESET",
            style: TextStyle(fontSize: 8, fontFamily: 'monospace', color: Colors.grey, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),

          ..._mocks.map((mockText) {
            return InkWell(
              onTap: () {
                _smsController.text = mockText;
              },
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1C1C1E),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[900]!),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.sms_failed_outlined, size: 14, color: Colors.grey),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        mockText,
                        style: const TextStyle(fontSize: 10, color: Colors.white70),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 16),

          // Custom Input Area
          const Text(
            "PASTE COMPLETE SAFARICOM MESSAGE BODY",
            style: TextStyle(fontSize: 8, fontFamily: 'monospace', color: Colors.grey, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _smsController,
            maxLines: 4,
            style: const TextStyle(color: Colors.white, fontSize: 11),
            decoration: InputDecoration(
              hintText: "E.g. QDL523RE4M Confirmed. KES 1,500.00 spent at CJ'S RESTAURANT...",
              hintStyle: TextStyle(color: Colors.grey[600], fontSize: 11),
              filled: true,
              fillColor: const Color(0xFF141416),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey[900]!),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Submit action block
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E7D32),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _isLoading ? null : () => _runParser(_smsController.text),
              child: _isLoading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text("PARSE WITH GEMINI", style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
