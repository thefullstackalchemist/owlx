import { NextRequest } from "next/server";
import { openrouter, MICROBRAIN } from "@/services/openrouter";
import { classifyIntent } from "@/services/chatService";
import { actionConsumer } from "@/services/ActionConsumer";

// ─── NDJSON streaming protocol ────────────────────────────────────────────────
//
//  { t: "action",          label, intent }          ← action resolved
//  { t: "new_transaction", data: NewTransactionData }← prefills modal
//  { t: "token",           v: string }              ← LLM stream
//  { t: "error",           msg: string }            ← failure
//
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Owl — a witty, sharp personal finance assistant.
Think in Indian Rupees (₹). Know Indian tax rules (IT Act, Old vs New regime).
When you receive transaction data, give a concise analysis: totals, top categories, one key insight.
When confirming a new transaction, be brief: confirm the details and say it's ready to save.
No corporate fluff. Talk like a smart friend who happens to know finance inside out.
Keep it tight — 3–5 sentences unless detail is explicitly asked for.`;

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const emit = (obj: object) => encoder.encode(JSON.stringify(obj) + "\n");

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { message, history = [] } = (await req.json()) as {
          message: string;
          history: { role: "user" | "assistant"; content: string }[];
        };

        // ── 1. Date context ────────────────────────────────────────────────
        const now = new Date();
        const dateContext = [
          `Today: ${now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
          `Month: ${now.toLocaleString("en-IN", { month: "long" })} ${now.getFullYear()}`,
          `FY: ${now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1}-${String(now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear()).slice(2)}`,
        ].join(" | ");

        // ── 2. Classify ────────────────────────────────────────────────────
        const intent = await classifyIntent(message, dateContext);

        // ── 3. ActionConsumer ──────────────────────────────────────────────
        const actionResult = await actionConsumer.consume(intent);

        if (actionResult) {
          controller.enqueue(
            emit({ t: "action", label: actionResult.label, intent: actionResult.intent })
          );
          // Prefill modal for add_transaction
          if (actionResult.newTransaction) {
            controller.enqueue(
              emit({ t: "new_transaction", data: actionResult.newTransaction })
            );
          }
        }

        // ── 4. Build LLM messages ──────────────────────────────────────────
        const userContent = actionResult?.data
          ? `${message}\n\n[Data]:\n${actionResult.data}`
          : message;

        const messages = [
          { role: "system" as const, content: `${SYSTEM_PROMPT}\n\n${dateContext}` },
          ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: userContent },
        ];

        // ── 5. Stream, stripping <think> ───────────────────────────────────
        let isThinking = false;

        for await (const token of openrouter.streamChat(messages, MICROBRAIN)) {
          if (token.includes("<think")) { isThinking = true; }
          if (isThinking) {
            if (token.includes("</think>")) isThinking = false;
            continue;
          }
          if (token) controller.enqueue(emit({ t: "token", v: token }));
        }
      } catch (err) {
        console.error("[chat/route]", err);
        controller.enqueue(emit({ t: "error", msg: "Something went wrong. Check your OpenRouter connection." }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}
