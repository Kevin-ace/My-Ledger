# 🇰🇪 M-Ledger Buddy — Smart Personal Finance Ledger

M-Ledger Buddy is a production-ready, highly polished full-stack personal finance organizer tailored to the Kenyan M-Pesa ecosystem. It enables users to parse raw SMS notifications automatically using Gemini AI, track spending against dynamic keyword-based budgets, and interact with a witty, Sheng-speaking financial coach.

---

## 🌟 Core Architecture & Feature Matrix

The codebase is built on a full-stack architecture (**React 19 + Express v4 + Vite + @google/genai SDK**), delivering smooth client-side rendering with server-side API proxying for security.

### 1. Ingestive SMS Parser Sandbox (`/src/components/MpesaSimulator.tsx`)
- **Action**: Paste or simulate raw Safaricom M-Pesa SMS logs (e.g. Lipa na M-Pesa, Paybills, Send Money, received transfers, Paybills/Tills, or cash withdrawals).
- **AI Processing**: Sent to the server-side `/api/parse-sms` route, which uses **Gemini 1.5 Flash** or **Gemini 2.5 Flash** to structure and extract:
  - Unique transaction reference code (e.g. `QFH112PE7F`).
  - Strict numeric transaction amount in KES.
  - Recipient or sender business names (e.g. `NAIVAS SUPERMARKET`).
  - Active transaction date and time.
  - Structured reason guess (e.g. "Naivas Supermarket grocery shopping").
  - `needsClarification` flag dynamically set to `true` on ambiguous transfers to prompt the user.

### 2. Live Ledger & Inline Editor (`/src/components/TransactionRow.tsx`)
- **Action**: Lists all transactions. Rows needing details are styled with soft amber borders and active visual alerts.
- **Inline Editing**: Allows users to instantly typing and refining their spend reason, prompting a direct update to the persistent budget status.

### 3. SVG Spending Trends & Metrics (`/src/components/SpendingCharts.tsx`)
- **Micro-analytics**: Visualizes total inflow, total outflow, and a dynamic "ledger cash-burn rate" (outflow over inflow progress bar) tracking safe savings pools.
- **Cumulative Graphs**: Formulates interactive SVG linear charts mapping cumulative expenditure growth with custom hover tooltips showing transaction node details.

### 4. Dynamic Budget Alert Tagging (`/src/components/BudgetSettings.tsx`)
- **Flexible Management**: Allows creating, removing, and adjusting budget limits targeting arbitrary transaction keywords (e.g. "Naivas", "Metro", "Restaurant").
- **Dynamic Warning System**: Automatically alerts users of nearing caps (over 80% usage) or exceeded limit budgets with detailed, animated telemetry items.

### 5. Sheng-Speaking Personal AI Coach (`/src/components/ChatAssistant.tsx` & `/api/chat-assistant`)
- **Personality**: A witty, analytical local "M-Ledger Buddy" speaking authentic Kenyan English & Sheng (referencing *chamas*, *paybills*, *m-shwari*, *till metrics*, and *soft life*).
- **Bespoke Advice**: Tracks active expenditures, current budget caps, and logs.
- **Dynamic Command Actions**: Underneath regular text, the agent returns structured Actions (e.g., `update_transaction` or `add_budget_limit` JSON blocks) which the frontend intercept to update active state automatically.

---

## 📁 Technical File Structure

```text
/
├── server.ts                  # Secure Express server entry point with Vite middleware proxy
├── src/
│   ├── App.tsx                # Client State engine, layout container & tab routing
│   ├── types.ts               # Shared TypeScript definitions (Transaction, BudgetLimit, ChatMessage)
│   ├── main.tsx               # Client entry point
│   └── components/
│       ├── TransactionRow.tsx # Individual transaction log cards & inline inline-editor
│       ├── BudgetSettings.tsx # Responsive budget limits tracker with state alerts
│       ├── SpendingCharts.tsx # Dynamic SVG curves & cash flow balances
│       ├── MpesaSimulator.tsx # Sandbox sandbox for raw SMS ingest testing
│       └── ChatAssistant.tsx  # Interactive chat widget with active AI indicators
├── .env.example               # Environmental definitions
├── package.json               # Modular Node dependencies
├── vite.config.ts             # Tailwind / React compilation rules
└── tsconfig.json              # TypeScript compilation specifications
```

---

## ⚙️ Local Development Setup

To run this application locally, ensure you have **Node.js (v18+)** installed.

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The dev server will boot on `http://localhost:3000`.

4. **Production Build Compilation**
   ```bash
   npm run build
   npm run start
   ```

---

## 📱 Future Implementation Recommendation: Rebuilding in Flutter

If you are planning to migrate or rebuild this system as a native mobile app using **Flutter (Dart)**, use the following architectural design:

### Suggested Directory Tree for Flutter (Clean Architecture)
```text
lib/
├── main.dart
├── models/
│   ├── transaction.dart
│   └── budget_limit.dart
├── providers/
│   ├── finance_provider.dart      # Manages state of transactions and budgets (using Riverpod or ChangeNotifier)
│   └── chat_provider.dart         # Manages AI assistant chat messages history
├── services/
│   └── gemini_service.dart        # Direct client-side or server proxy calls to Gemini API
└── screens/
    ├── home_screen.dart           # Dashboard with cash flow metrics and bento shortcuts
    ├── ledger_screen.dart         # Scrollable ListView containing interactive TransactionRows
    ├── budget_screen.dart         # Budgeting monitors, indicators & progress indicators
    ├── simulator_screen.dart      # Action center to simulate M-Pesa parsing
    └── coach_screen.dart          # Chat view with message bubble styling and dynamic JSON parser
```

### Direct Migration Mapping (Component to Widget)
1. **`App.tsx` (State Engine)** $\rightarrow$ Use **Riverpod** (`StateNotifierProvider`) or native Flutter **ChangeNotifier** to hold lists of transactions and budget limits globally. Use **Shared Preferences** or **Hive** for ultra-fast offline serialization on mobile devices.
2. **`SpendingCharts.tsx`** $\rightarrow$ Re-implement using the standard **`fl_chart`** Flutter package (the most comprehensive toolkit for modern Bezier lines and progress bars) or use custom canvas drawings with a `CustomPainter`.
3. **`TransactionRow.tsx`** $\rightarrow$ Use Flutter **`Card`** or **`Container`** decorated with elegant `BoxDecoration` featuring `amberAccent` highlights. Use standard `TextField` with `onChanged` and debouncing for inline description changes.
4. **`ChatAssistant.tsx`** $\rightarrow$ Build on top of a classic `ListView.builder` managing state, paired with a custom Markdown widget (`flutter_markdown`) to correctly format the AI's witty advice blocks.
