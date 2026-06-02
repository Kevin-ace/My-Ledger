// lib/main.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/finance_provider.dart';
import 'screens/dashboard_screen.dart';
import 'screens/ledger_screen.dart';
import 'screens/budget_screen.dart';
import 'screens/simulator_screen.dart';
import 'screens/coach_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => FinanceProvider()),
      ],
      child: const MLedgerApp(),
    ),
  );
}

class MLedgerApp extends StatelessWidget {
  const MLedgerApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'M-Ledger Buddy',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0C0C0E),
        primaryColor: const Color(0xFF2E7D32),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF2E7D32),
          secondary: Color(0xFF81C784),
          surface: Color(0xFF1C1C1E),
        ),
        fontFamily: 'Inter',
      ),
      home: const MLedgerShell(),
    );
  }
}

class MLedgerShell extends StatefulWidget {
  const MLedgerShell({Key? key}) : super(key: key);

  @override
  State<MLedgerShell> createState() => _MLedgerShellState();
}

class _MLedgerShellState extends State<MLedgerShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final List<Widget> screens = [
      DashboardScreen(
        onNavigateToLedger: () => setState(() => _currentIndex = 1),
        onNavigateToBudget: () => setState(() => _currentIndex = 2),
        onNavigateToCoach: () => setState(() => _currentIndex = 4),
      ),
      const LedgerScreen(),
      const BudgetScreen(),
      SimulatorScreen(
        onParseSuccess: () => setState(() => _currentIndex = 1),
      ),
      const CoachScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFF1B3B24),
              ),
              child: const Text("KE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.black, color: Color(0xFF81C784))),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("M-Ledger Buddy", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                Text("Safaricom 5G Ledger Tracker", style: TextStyle(fontSize: 8, color: Colors.grey, fontFamily: 'monospace')),
              ],
            )
          ],
        ),
        backgroundColor: const Color(0xFF121214),
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: CircleAvatar(
              radius: 14,
              backgroundColor: Colors.grey[800],
              child: const Text("👤", style: TextStyle(fontSize: 12)),
            ),
          )
        ],
      ),
      body: SafeArea(
        child: screens[_currentIndex],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xFF121214),
        selectedItemColor: const Color(0xFF81C784),
        unselectedItemColor: Colors.grey[600],
        selectedFontSize: 9,
        unselectedFontSize: 9,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: "Home"),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined), activeIcon: Icon(Icons.receipt_long), label: "Ledger"),
          BottomNavigationBarItem(icon: Icon(Icons.settings_outlined), activeIcon: Icon(Icons.settings), label: "Budget"),
          BottomNavigationBarItem(icon: Icon(Icons.add_to_home_screen_outlined), activeIcon: Icon(Icons.add_to_home_screen), label: "Sandbox"),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), activeIcon: Icon(Icons.chat_bubble), label: "Coach"),
        ],
      ),
    );
  }
}
