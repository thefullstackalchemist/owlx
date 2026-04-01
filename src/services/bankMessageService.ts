import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { openrouter } from "@/services/openrouter";

export interface BankSmsPayload {
  sender:     string;
  message:    string;
  receivedAt: string; // ISO string
  simSlot?:   number;
}

export interface ExtractedTransaction {
  accountLastFour: string | null;
  amount:          number;
  type:            "income" | "expense" | "transfer";
  recipient:       string;
  remarks:         string;
  date:            string; // ISO string
}

const EXTRACT_PROMPT = (sender: string, message: string, receivedAt: string) => `
You are a bank SMS parser. Extract transaction details from the SMS below.
Return ONLY a valid JSON object — no explanation, no markdown fences.

SMS Sender: ${sender}
SMS Text: ${message}
Received At: ${receivedAt}

JSON schema (all fields required):
{
  "accountLastFour": "<last 4 digits of account/card number, or null if not present>",
  "amount": <transaction amount as a number, no commas, no currency symbol>,
  "type": "<expense|income|transfer>",
  "recipient": "<who was paid / who paid / transfer destination — use merchant/UPI ID/person name>",
  "remarks": "<any reference number, UPI ID, info text, or remarks from the message>",
  "date": "<ISO 8601 date string parsed from the message, fallback to receivedAt>"
}

Rules:
- Debit/debited/withdrawn/paid → type "expense"
- Credit/credited/received/deposited → type "income"
- IMPS/NEFT/transfer between own accounts → type "transfer"
- amount must be a plain number (e.g. 2500.00)
- If a field is missing, use null for accountLastFour and empty string for others
`.trim();

function parseExtracted(raw: string): ExtractedTransaction | null {
  // Strip any accidental markdown fences
  const cleaned = raw.replace(/```[a-z]*\n?/g, "").trim();

  // Find first { ... } block
  const start = cleaned.indexOf("{");
  const end   = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as ExtractedTransaction;
  } catch {
    return null;
  }
}

const MAX_RETRIES = 3;

async function extractWithRetry(payload: BankSmsPayload): Promise<ExtractedTransaction> {
  const prompt = EXTRACT_PROMPT(payload.sender, payload.message, payload.receivedAt);
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw       = await openrouter.analyze(prompt);
      const extracted = parseExtracted(raw);

      if (extracted) return extracted;

      lastError = `Attempt ${attempt}: AI response was not valid JSON`;
      console.warn(`[bankMessage] ${lastError} — raw: ${raw.slice(0, 200)}`);
    } catch (err) {
      lastError = `Attempt ${attempt}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[bankMessage] ${lastError}`);
    }
  }

  throw new Error(`AI extraction failed after ${MAX_RETRIES} attempts. Last error: ${lastError}`);
}

export async function processBankSms(payload: BankSmsPayload): Promise<{ ok: true; txnId: string } | { ok: false; error: string }> {
  let extracted: ExtractedTransaction;

  try {
    extracted = await extractWithRetry(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[bankMessage] Giving up on SMS from ${payload.sender}: ${message}`);
    return { ok: false, error: message };
  }

  if (!extracted) {
    return { ok: false, error: "AI could not parse the SMS into a transaction" };
  }

  if (!extracted.amount || extracted.amount <= 0) {
    return { ok: false, error: "No valid amount found in SMS" };
  }

  const description = [
    extracted.recipient || payload.sender,
    extracted.accountLastFour ? `(XX${extracted.accountLastFour})` : "",
  ].filter(Boolean).join(" ");

  await connectDB();

  const txn = await Transaction.create({
    date:           new Date(extracted.date || payload.receivedAt),
    amount:         extracted.amount,
    type:           extracted.type || "expense",
    category:       "Uncategorized",
    description:    description.trim() || "Bank transaction",
    platform:       payload.sender,
    needsRepayment: false,
    needsReview:    true,
    smsSource:      payload.message,
  });

  return { ok: true, txnId: String(txn._id) };
}
