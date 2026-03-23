import { NextRequest, NextResponse } from "next/server";
import { getBot } from "@/services/telegram";
import { handleTelegramMessage } from "@/services/telegramOrchestrator";

// Telegram sends POST updates to this endpoint in webhook mode.
// In polling mode (dev) this route is never called.

export async function POST(req: NextRequest) {
  try {
    const update = await req.json() as {
      message?: {
        chat: { id: number };
        text?: string;
      };
    };

    const msg    = update.message;
    const chatId = msg?.chat?.id;
    const text   = msg?.text?.trim();

    if (!chatId || !text) return NextResponse.json({ ok: true });

    console.log(`[telegram/webhook] chat_id=${chatId} text="${text}"`);

    // Guard: only respond to your own chat
    const allowedId = process.env.TELEGRAM_CHAT_ID;
    if (allowedId && String(chatId) !== allowedId) {
      // In serverless mode the in-memory counter can't persist,
      // so just send a single polite decline every time.
      await getBot().sendMessage(chatId, "🔒 This is a private bot and cannot respond to your messages.");
      return NextResponse.json({ ok: true });
    }

    await handleTelegramMessage(chatId, text);
  } catch (err) {
    console.error("[telegram/webhook] error:", err);
  }

  return NextResponse.json({ ok: true });
}
