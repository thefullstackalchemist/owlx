import TelegramBot from "node-telegram-bot-api";
import { handleTelegramMessage } from "./telegramOrchestrator";

let bot: TelegramBot | null = null;

// Track message counts for unknown chats (in-memory, resets on restart)
const unknownChatCounts = new Map<number, number>();
const UNKNOWN_CHAT_LIMIT = 10;
const BLOCK_MSG =
  "🚫 This bot is private. You've sent too many messages — further messages will be ignored.";

export function getBot(): TelegramBot {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set in .env.local");
    bot = new TelegramBot(token);
  }
  return bot;
}

/** Start polling — call once from instrumentation.ts */
export function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN not set — bot not started");
    return;
  }

  const b = getBot();
  b.startPolling({ restart: true });

  b.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text   = msg.text?.trim();

    console.log(`[telegram] chat_id=${chatId} text="${text}"`);

    if (!text) return;

    // Auto-hint chat ID if not configured
    if (!process.env.TELEGRAM_CHAT_ID) {
      console.warn(`[telegram] Add to .env.local → TELEGRAM_CHAT_ID=${chatId}`);
    }

    // Guard: only respond to your own chat
    const allowedId = process.env.TELEGRAM_CHAT_ID;
    if (allowedId && String(chatId) !== allowedId) {
      const count = (unknownChatCounts.get(chatId) ?? 0) + 1;
      unknownChatCounts.set(chatId, count);

      if (count === 1) {
        // First message — politely decline
        await getBot().sendMessage(
          chatId,
          "🔒 This is a private bot and cannot respond to your messages.",
        );
      } else if (count === UNKNOWN_CHAT_LIMIT) {
        // Warn on the 10th message, then go silent
        await getBot().sendMessage(chatId, BLOCK_MSG);
      }
      // Beyond the limit — silently drop
      return;
    }

    try {
      await handleTelegramMessage(chatId, text);
    } catch (err) {
      console.error("[telegram] handler error:", err);
    }
  });

  b.on("polling_error", (err) => {
    console.error("[telegram] polling error:", err.message);
  });

  console.log("[owl] Telegram bot started (polling)");
}

/** Send a message to a chat */
export async function sendMessage(chatId: number, text: string): Promise<void> {
  await getBot().sendMessage(chatId, text, { parse_mode: "Markdown" });
}

/**
 * Stream an AsyncGenerator<string> into a Telegram message.
 * Sends a placeholder "…" first, then edits it with accumulated tokens
 * every ~1 s (Telegram allows ~1 edit/s per chat).
 * Returns the final assembled text.
 */
export async function streamToTelegram(
  chatId: number,
  tokenStream: AsyncGenerator<string>,
): Promise<string> {
  const b = getBot();

  // Send placeholder so the user sees something immediately
  const sent = await b.sendMessage(chatId, "…");
  const msgId = sent.message_id;

  let accumulated = "";
  let lastEdit    = Date.now();
  const THROTTLE  = 1000; // ms between edits

  for await (const token of tokenStream) {
    accumulated += token;

    const now = Date.now();
    if (now - lastEdit >= THROTTLE && accumulated.trim()) {
      try {
        await b.editMessageText(accumulated, {
          chat_id:    chatId,
          message_id: msgId,
          parse_mode: "Markdown",
        });
        lastEdit = now;
      } catch { /* ignore "message not modified" errors */ }
    }
  }

  // Final edit with complete text
  if (accumulated.trim()) {
    try {
      await b.editMessageText(accumulated, {
        chat_id:    chatId,
        message_id: msgId,
        parse_mode: "Markdown",
      });
    } catch { /* ignore */ }
  }

  return accumulated;
}

/** Push a notification to your configured Telegram chat */
export async function notify(text: string): Promise<void> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    console.warn("[telegram] TELEGRAM_CHAT_ID not set — notification skipped");
    return;
  }
  await sendMessage(Number(chatId), text);
}
