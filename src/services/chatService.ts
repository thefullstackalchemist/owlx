import { openrouter, MICROBRAIN } from "./openrouter";
import { TRANSACTION_CATEGORIES } from "@/constants";
import type { TransactionFilters } from "./transactions";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NewTransactionData {
  amount: number;
  type: "income" | "expense" | "transfer";
  category: string;
  description: string;
  date: string;        // YYYY-MM-DD
  platform?: string;
}

export interface ChatIntent {
  action: "query_transactions" | "add_transaction" | "general";
  filters: TransactionFilters;
  newTransaction: NewTransactionData | null;
}

// ─── Classifier prompt ────────────────────────────────────────────────────────

const CATEGORIES_LIST = TRANSACTION_CATEGORIES.join(", ");

const CLASSIFY_SYSTEM = `You are a finance app intent classifier. Return ONLY valid JSON, no markdown, no explanation.

Schema:
{
  "action": "query_transactions" | "add_transaction" | "general",
  "filters": {
    "period": "this_month" | "last_month" | "this_year" | "last_7_days" | "all" | null,
    "category": string | null,
    "type": "income" | "expense" | "transfer" | null
  },
  "newTransaction": {
    "amount": number,
    "type": "income" | "expense" | "transfer",
    "category": string,
    "description": string,
    "date": "YYYY-MM-DD",
    "platform": string | null
  } | null
}

Available categories: ${CATEGORIES_LIST}
Use today's ISO date from context for "today", infer "yesterday" etc.

Platform extraction rules:
- platform = the app, website, store, or service used to make the purchase/payment
- Examples: Amazon, Swiggy, Zomato, Uber, Netflix, Spotify, Flipkart, Myntra, BigBasket, PhonePe, GPay, PayTM, IRCTC, BookMyShow, etc.
- If a brand/platform is mentioned, always populate "platform" — do NOT leave it null
- "description" should be what was bought/done, NOT the platform name
- If no platform is mentioned, set "platform": null

Examples:
"how are my spends this month" → {"action":"query_transactions","filters":{"period":"this_month","type":"expense","category":null},"newTransaction":null}
"show food transactions" → {"action":"query_transactions","filters":{"period":null,"category":"Food & Dining","type":null},"newTransaction":null}
"salary this year" → {"action":"query_transactions","filters":{"period":"this_year","category":null,"type":"income"},"newTransaction":null}
"add 100 sandwich today" → {"action":"add_transaction","filters":{"period":null,"type":null,"category":null},"newTransaction":{"amount":100,"type":"expense","category":"Food & Dining","description":"Sandwich","date":"TODAY_ISO","platform":null}}
"spent 200 on uber" → {"action":"add_transaction","filters":{"period":null,"type":null,"category":null},"newTransaction":{"amount":200,"type":"expense","category":"Transport","description":"Uber ride","date":"TODAY_ISO","platform":"Uber"}}
"1500 amazon order for pants" → {"action":"add_transaction","filters":{"period":null,"type":null,"category":null},"newTransaction":{"amount":1500,"type":"expense","category":"Shopping","description":"Pants","date":"TODAY_ISO","platform":"Amazon"}}
"ordered food on swiggy 350 biryani" → {"action":"add_transaction","filters":{"period":null,"type":null,"category":null},"newTransaction":{"amount":350,"type":"expense","category":"Food & Dining","description":"Biryani","date":"TODAY_ISO","platform":"Swiggy"}}
"netflix subscription 649" → {"action":"add_transaction","filters":{"period":null,"type":null,"category":null},"newTransaction":{"amount":649,"type":"expense","category":"Subscriptions","description":"Netflix subscription","date":"TODAY_ISO","platform":"Netflix"}}
"salary 50000 credited" → {"action":"add_transaction","filters":{"period":null,"type":null,"category":null},"newTransaction":{"amount":50000,"type":"income","category":"Salary","description":"Salary","date":"TODAY_ISO","platform":null}}
"what is 80C" → {"action":"general","filters":{"period":null,"type":null,"category":null},"newTransaction":null}`;

// ─── Classifier ───────────────────────────────────────────────────────────────

export async function classifyIntent(message: string, dateContext: string): Promise<ChatIntent> {
  const todayISO = new Date().toISOString().split("T")[0];

  try {
    const raw = await openrouter.chat(
      [
        { role: "system", content: CLASSIFY_SYSTEM.replace(/TODAY_ISO/g, todayISO) },
        { role: "user", content: `Date context: ${dateContext}\nToday ISO: ${todayISO}\nMessage: ${message}` },
      ],
      MICROBRAIN
    );

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no json");

    const parsed = JSON.parse(match[0]) as ChatIntent;
    // Ensure newTransaction date defaults to today if missing
    if (parsed.newTransaction && !parsed.newTransaction.date) {
      parsed.newTransaction.date = todayISO;
    }
    return parsed;
  } catch {
    return { action: "general", filters: { period: null, category: null, type: null }, newTransaction: null };
  }
}
