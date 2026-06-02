/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

// Lazy initialization of Gemini client
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required to access intelligence features. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Parse M-Pesa messages Endpoint
  app.post("/api/parse-mpesa", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        res.status(400).json({ error: "Missing or invalid 'text' property in request body." });
        return;
      }

      const client = getGeminiClient();

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze this raw SMS or transaction description: "${text}".
Determine if it represents a valid financial transaction (M-Pesa or general).
Extract the details into JSON.

Formulate a concise 'reason' representing what the payment was for (e.g., 'Groceries at Naivas Supermarket', 'Lunch contribution with EVAN MWANGI', 'Commuting via Super Metro', etc.) using clues in the merchant or recipient names. If there is no specific clue, use a generic description (e.g., 'Payment to CJ\'S RESTAURANT').
Identify if it is an income (receiving money) or expense (paying/sending money, buying goods, paybill, withdrawal, transaction costs).

CRITICAL DIRECTIVE: Always return needsClarification as true to prompt the user for personalized details.`,
        config: {
          systemInstruction: "You are a professional Kenyan fintech analyst backend. Parse the message with absolute precision, extracting actual currency numbers and mapping names carefully. If the text does not contain a clear financial transaction, set success to false. To respect user intent, you MUST set needsClarification to true on every parsed transaction.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              success: {
                type: Type.BOOLEAN,
                description: "True if a financial transaction was successfully extracted."
              },
              code: {
                type: Type.STRING,
                description: "The M-Pesa transaction code if available (e.g. QDF123RTY8), otherwise generate a random unique one if it is a transaction."
              },
              amount: {
                type: Type.NUMBER,
                description: "The numeric amount of the transaction."
              },
              type: {
                type: Type.STRING,
                description: "Value must be either 'income' or 'expense'."
              },
              recipientOrSender: {
                type: Type.STRING,
                description: "The company, billing name, till number, or person receiving or sending the cash."
              },
              date: {
                type: Type.STRING,
                description: "Human readable transaction date (e.g. June 2, 2026)."
              },
              time: {
                type: Type.STRING,
                description: "Formatted transaction time if available (e.g. 10:14 AM)."
              },
              reason: {
                type: Type.STRING,
                description: "Best fit suggested reason/purpose describing what occurred (e.g. 'Naivas Supermarket grocery shopping')."
              },
              needsClarification: {
                type: Type.BOOLEAN,
                description: "Must always be true to initiate active user engagement about custom items bought or exact breakdown."
              }
            },
            required: ["success", "code", "amount", "type", "recipientOrSender", "date", "reason", "needsClarification"]
          }
        }
      });

      const parsedData = JSON.parse(response.text || "{}");
      res.json(parsedData);
    } catch (error: any) {
      console.error("Gemini Parsing Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to analyze raw text"
      });
    }
  });

  // Chat assistant endpoint
  app.post("/api/chat-assistant", async (req: Request, res: Response) => {
    try {
      const { message, history, context } = req.body;
      if (!message || typeof message !== "string") {
        res.status(400).json({ error: "Missing or invalid 'message' property." });
        return;
      }

      const client = getGeminiClient();

      const contextString = `
Current Active Database Transactions:
${JSON.stringify(context?.recentTransactions || [], null, 2)}

Spending/Budget Limits:
${JSON.stringify(context?.budgetLimits || [], null, 2)}
`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `User asks: "${message}"

Context info (transactions and budgets):
${contextString}

Determine if this message:
1. Clarifies an existing pending transaction (e.g., "The JENNIFER WAITHRA transfer was actually rent" or "QDL523RE4M CJ's was client meeting"). If so, parse the client intent, match the transaction code or name, and return the database 'update_transaction' action in JSON block.
2. Requests financial advice or budgeting suggestions. If the user asks for financial tips, budget coach advice, savings analysis, or overspending reviews, look carefully at the context info (the customer's actual expenditures, salary, limits) and output comprehensive actionable advice under Kenyan shilling metrics (Ksh). Since limits are keyword-based (e.g. matching 'Naivas' or 'Metro' or 'Groceries'), trace reasons and payee names directly to evaluate spending and overspends. Keep the style witty, encouraging, and local (Safaricom, Paybills, Till metrics, Chamas, local travel).
3. Requests change of budget limit targets. Support 'add_budget_limit' action.`,
        config: {
          systemInstruction: "You are 'M-Ledger Buddy', a witty, professional Kenyan AI financial advisor and budget coach. Analyze M-Pesa logs, current budget caps, and the user's clarifications to offer highly bespoke, tactical financial planning tips (e.g. the 50/30/20 rule, chama groups, transport hacks, avoiding transaction fees). Keep responses encouraging, clear, and focused on building wealth. When returning JSON actions, match transactionId or transactionCode exactly to execute the change successfully in the UI database.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: "Your personalized assistant response. Parse the user's input, look at active transaction details (specifically 'reason' and 'recipientOrSender' fields) to calculate budgets, overspending, etc."
              },
              action: {
                type: Type.OBJECT,
                description: "Optional action if the user's message is clarifying, editing a transaction, or modifying budget limit targets.",
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "Currently supports 'update_transaction' or 'add_budget_limit' or 'none'."
                  },
                  transactionId: {
                    type: Type.STRING,
                    description: "The transaction ID or code to modify if updating a transaction."
                  },
                  updates: {
                    type: Type.OBJECT,
                    description: "Modifications to the transaction or budget limits.",
                    properties: {
                      reason: { type: Type.STRING, description: "New clarified reason/note" },
                      keyword: { type: Type.STRING, description: "The budget tracking keyword" },
                      limit: { type: Type.NUMBER, description: "Budget limit value" }
                    }
                  }
                }
              }
            },
            required: ["text"]
          }
        }
      });

      const parsedData = JSON.parse(response.text || "{}");
      res.json(parsedData);
    } catch (error: any) {
      console.error("Gemini Chat Assistant Error:", error);
      res.status(500).json({
        error: error.message || "Failed to process chat input"
      });
    }
  });

  // Serve static files in production or hook into Vite in Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched and running on host 0.0.0.0, port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server startup crash:", err);
  process.exit(1);
});
