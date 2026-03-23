import { sendMessage, streamToTelegram, getBot } from "./telegram";
import { classifyIntent, type NewTransactionData } from "./chatService";
import { openrouter, MICROBRAIN } from "./openrouter";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { ChatMessage } from "@/models/ChatMessage";

// ─── Pending confirmation store (in-memory, personal app) ─────────────────────
// TTL: 10 minutes. Keyed by Telegram chat ID.

interface PendingEntry {
  txn:     NewTransactionData;
  expires: number;
}

const pending = new Map<number, PendingEntry>();

function clearExpired() {
  const now = Date.now();
  for (const [id, entry] of pending) {
    if (entry.expires < now) pending.delete(id);
  }
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatConfirmation(txn: NewTransactionData): string {
  const sign = txn.type === "income" ? "+" : txn.type === "expense" ? "-" : "";
  const date = new Date(txn.date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return [
    `📋 *Transaction Details*`,
    ``,
    `💰 *Amount:* ${sign}₹${txn.amount.toLocaleString("en-IN")}`,
    `📂 *Category:* ${txn.category}`,
    `📝 *Description:* ${txn.description}`,
    txn.platform ? `🏪 *Platform:* ${txn.platform}` : null,
    `📅 *Date:* ${date}`,
    `💸 *Type:* ${txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}`,
    ``,
    `Reply *yes* to save, *no* to cancel, or describe any corrections.`,
  ].filter(Boolean).join("\n");
}

// ─── Log to MongoDB ───────────────────────────────────────────────────────────

async function log(role: "user" | "assistant", content: string) {
  try {
    await connectDB();
    await ChatMessage.create({ role, content, source: "telegram" });
  } catch { /* non-critical */ }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function handleTelegramMessage(
  chatId: number,
  text:   string
): Promise<void> {
  clearExpired();

  const lower = text.trim().toLowerCase();

  // ── Confirmation flow ──────────────────────────────────────────────────────
  const pendingEntry = pending.get(chatId);

  if (pendingEntry) {
    if (lower === "yes" || lower === "y" || lower === "confirm") {
      // Save transaction
      await connectDB();
      const txn = pendingEntry.txn;
      await Transaction.create({
        date:        new Date(txn.date),
        amount:      txn.amount,
        type:        txn.type,
        category:    txn.category,
        description: txn.description,
        platform:    txn.platform || undefined,
      });
      pending.delete(chatId);

      const confirm = `✅ *Saved!*\n₹${txn.amount.toLocaleString("en-IN")} · ${txn.description} · ${txn.category}`;
      await sendMessage(chatId, confirm);
      await log("user", text);
      await log("assistant", confirm);
      return;
    }

    if (lower === "no" || lower === "cancel") {
      pending.delete(chatId);
      const msg = "❌ Cancelled. Nothing was saved.";
      await sendMessage(chatId, msg);
      await log("user", text);
      await log("assistant", msg);
      return;
    }

    // Treat as a correction — fall through to re-classify below
  }

  await log("user", text);

  // Keep sending "typing" every 4 s until the LLM responds (Telegram clears it after ~5 s)
  let typingActive = true;
  const typingLoop = (async () => {
    while (typingActive) {
      try { await getBot().sendChatAction(chatId, "typing"); } catch { /* non-critical */ }
      await new Promise((r) => setTimeout(r, 4000));
    }
  })();

  // ── Classify intent ────────────────────────────────────────────────────────
  const now = new Date();
  const dateContext = [
    `Today: ${now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
    `Month: ${now.toLocaleString("en-IN", { month: "long" })} ${now.getFullYear()}`,
  ].join(" | ");

  const intent = await classifyIntent(text, dateContext);
  typingActive = false;
  await typingLoop;

  // ── add_transaction ────────────────────────────────────────────────────────
  if (intent.action === "add_transaction" && intent.newTransaction) {
    const txn = intent.newTransaction;
    pending.set(chatId, { txn, expires: Date.now() + 10 * 60 * 1000 });

    const reply = formatConfirmation(txn);
    await sendMessage(chatId, reply);
    await log("assistant", reply);
    return;
  }

  // ── query — disabled on Telegram for privacy ───────────────────────────────
  if (intent.action === "query_transactions") {
    const reply =
      `🔒 *Insights are disabled on Telegram.*\n\n` +
      `Spend summaries, income reports, and category breakdowns contain sensitive financial data ` +
      `and are only available in the app where your session is encrypted.\n\n` +
      `👉 Open the app to view your analytics.`;
    await sendMessage(chatId, reply);
    await log("user", text);
    await log("assistant", reply);
    return;
  }

  // ── general — stream a real LLM response ──────────────────────────────────
  const stream = openrouter.streamChat(
    [
      {
        role: "system",
        content:
          "You are OWL, a concise personal finance assistant. " +
          "You can only add transactions via Telegram — insights and queries are disabled for privacy. " +
          "Keep replies short and helpful. Use Markdown sparingly.",
      },
      { role: "user", content: text },
    ],
    MICROBRAIN,
  );

  const reply = await streamToTelegram(chatId, stream);
  await log("assistant", reply);
}
