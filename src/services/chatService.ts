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

export interface BucketOperation {
  bucketName: string;          // what the user said — matched fuzzy server-side
  amount:     number;
  direction:  "add" | "remove";
}

export interface ChatIntent {
  action:          "query_transactions" | "add_transaction" | "bucket_operation" | "general";
  filters:         TransactionFilters;
  newTransaction:  NewTransactionData | null;
  bucketOperation: BucketOperation | null;
}

// ─── Classifier prompt ────────────────────────────────────────────────────────

const CATEGORIES_LIST = TRANSACTION_CATEGORIES.join(", ");

const CLASSIFY_SYSTEM = `You are a finance app intent classifier. Return ONLY valid JSON, no markdown, no explanation.

Schema:
{
  "action": "query_transactions" | "add_transaction" | "bucket_operation" | "general",
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
  } | null,
  "bucketOperation": {
    "bucketName": string,
    "amount": number,
    "direction": "add" | "remove"
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

Bucket operation rules:
- Use "bucket_operation" when user wants to add money to or remove money from a savings bucket/goal
- "bucketName" must match (fuzzy) one of the available bucket names from context
- "direction" is "add" when depositing/putting in; "remove" when withdrawing/taking out
- BUCKETS_CONTEXT_PLACEHOLDER

Examples:
"how are my spends this month" → {"action":"query_transactions","filters":{"period":"this_month","type":"expense","category":null},"newTransaction":null,"bucketOperation":null}
"show food transactions" → {"action":"query_transactions","filters":{"period":null,"category":"Food & Dining","type":null},"newTransaction":null,"bucketOperation":null}
"salary this year" → {"action":"query_transactions","filters":{"period":"this_year","category":null,"type":"income"},"newTransaction":null,"bucketOperation":null}
"add 100 sandwich today" → {"action":"add_transaction","filters":{"period":null,"type":null,"category":null},"newTransaction":{"amount":100,"type":"expense","category":"Food & Dining","description":"Sandwich","date":"TODAY_ISO","platform":null},"bucketOperation":null}
"spent 200 on uber" → {"action":"add_transaction","filters":{"period":null,"type":null,"category":null},"newTransaction":{"amount":200,"type":"expense","category":"Transport","description":"Uber ride","date":"TODAY_ISO","platform":"Uber"},"bucketOperation":null}
"1500 amazon order for pants" → {"action":"add_transaction","filters":{"period":null,"type":null,"category":null},"newTransaction":{"amount":1500,"type":"expense","category":"Shopping","description":"Pants","date":"TODAY_ISO","platform":"Amazon"},"bucketOperation":null}
"ordered food on swiggy 350 biryani" → {"action":"add_transaction","filters":{"period":null,"type":null,"category":null},"newTransaction":{"amount":350,"type":"expense","category":"Food & Dining","description":"Biryani","date":"TODAY_ISO","platform":"Swiggy"},"bucketOperation":null}
"netflix subscription 649" → {"action":"add_transaction","filters":{"period":null,"type":null,"category":null},"newTransaction":{"amount":649,"type":"expense","category":"Subscriptions","description":"Netflix subscription","date":"TODAY_ISO","platform":"Netflix"},"bucketOperation":null}
"salary 50000 credited" → {"action":"add_transaction","filters":{"period":null,"type":null,"category":null},"newTransaction":{"amount":50000,"type":"income","category":"Salary","description":"Salary","date":"TODAY_ISO","platform":null},"bucketOperation":null}
"add 5000 to emergency fund" → {"action":"bucket_operation","filters":{"period":null,"type":null,"category":null},"newTransaction":null,"bucketOperation":{"bucketName":"Emergency Fund","amount":5000,"direction":"add"}}
"take 2000 from vacation bucket" → {"action":"bucket_operation","filters":{"period":null,"type":null,"category":null},"newTransaction":null,"bucketOperation":{"bucketName":"Vacation","amount":2000,"direction":"remove"}}
"what is 80C" → {"action":"general","filters":{"period":null,"type":null,"category":null},"newTransaction":null,"bucketOperation":null}`;

// ─── Classifier ───────────────────────────────────────────────────────────────

export async function classifyIntent(
  message: string,
  dateContext: string,
  bucketContext?: string
): Promise<ChatIntent> {
  const todayISO = new Date().toISOString().split("T")[0];

  const bucketsLine = bucketContext
    ? `Available buckets: ${bucketContext}`
    : "No savings buckets configured yet.";

  const systemPrompt = CLASSIFY_SYSTEM
    .replace(/TODAY_ISO/g, todayISO)
    .replace("BUCKETS_CONTEXT_PLACEHOLDER", bucketsLine);

  try {
    const raw = await openrouter.chat(
      [
        { role: "system", content: systemPrompt },
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
    if (!parsed.bucketOperation) parsed.bucketOperation = null;
    return parsed;
  } catch {
    return { action: "general", filters: { period: null, category: null, type: null }, newTransaction: null, bucketOperation: null };
  }
}
