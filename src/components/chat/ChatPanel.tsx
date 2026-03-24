"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Sparkles, Database, Receipt, CheckCircle2, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/utils/cn";
import NewTransactionModal from "@/components/transactions/NewTransactionModal";
import type { NewTransactionData } from "@/services/chatService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActionInfo {
  label: string;
  intent: unknown;
}

interface Message {
  id:          string;
  role:        "user" | "assistant";
  content:     string;
  source?:     "web" | "telegram";
  actionInfo?: ActionInfo;
  pendingTxn?: NewTransactionData;   // prefilled data from AI
  txnSaved?:   boolean;              // true once user saved it
}

const QUICK_PROMPTS = [
  "How are my spends this month?",
  "Add ₹200 Swiggy food today",
  "What's my top expense category?",
  "Show last month's transactions",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-1" />
      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-2" />
      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-3" />
    </div>
  );
}

function ActionChip({ info }: { info: ActionInfo }) {
  return (
    <div className="flex items-center gap-1.5 self-start rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 mb-1 animate-fade-in-up">
      <Database size={10} className="text-blue-400 shrink-0" />
      <span className="text-[10px] text-blue-600 font-medium">{info.label}</span>
    </div>
  );
}

function TransactionWidget({
  data,
  saved,
  onOpen,
}: {
  data:   NewTransactionData;
  saved:  boolean;
  onOpen: () => void;
}) {
  if (saved) {
    return (
      <div className="flex items-center gap-1.5 mt-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 self-start animate-fade-in-up">
        <CheckCircle2 size={12} className="text-green-500 shrink-0" />
        <span className="text-[11px] font-medium text-green-700">
          Saved · ₹{data.amount.toLocaleString("en-IN")} · {data.description}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-2 mt-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 self-start text-left transition-all hover:bg-violet-100 hover:border-violet-300 hover:shadow-sm animate-fade-in-up"
    >
      <Receipt size={12} className="text-violet-500 shrink-0" />
      <div>
        <p className="text-[11px] font-semibold text-violet-700">
          ₹{data.amount.toLocaleString("en-IN")} · {data.description}
        </p>
        <p className="text-[10px] text-violet-400 mt-0.5">Tap to review &amp; save transaction</p>
      </div>
    </button>
  );
}

function TelegramBadge() {
  return (
    <div className="flex items-center gap-1 self-start mb-1">
      <MessageCircle size={9} className="text-sky-400" />
      <span className="text-[9px] font-medium tracking-wide text-sky-400 uppercase">Telegram</span>
    </div>
  );
}

function ChatMessage({
  message,
  onOpenTxn,
}: {
  message:    Message;
  onOpenTxn:  (id: string) => void;
}) {
  const isUser     = message.role === "user";
  const isTelegram = message.source === "telegram";

  return (
    <div className={cn("flex flex-col animate-fade-in-up", isUser ? "items-end" : "items-start")}>
      {!isUser && isTelegram && <TelegramBadge />}
      {!isUser && message.actionInfo && <ActionChip info={message.actionInfo} />}
      <div className={cn("flex", isUser ? "justify-end" : "justify-start w-full")}>
        {!isUser && <span className="text-sm mr-1.5 mt-0.5 shrink-0">{isTelegram ? "✈️" : "🦉"}</span>}
        <div className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          // Web — user: indigo solid; bot: amber-tinted with left accent border
          isUser && !isTelegram  && "bg-indigo-600 text-white rounded-br-sm shadow-sm",
          !isUser && !isTelegram && "bg-amber-50 border-l-4 border-amber-400 border-y border-r border-y-amber-200 border-r-amber-200 text-slate-800 rounded-bl-sm",
          // Telegram — user: teal solid; bot: teal-tinted with left accent border
          isUser && isTelegram   && "bg-teal-600 text-white rounded-br-sm shadow-sm",
          !isUser && isTelegram  && "bg-teal-50 border-l-4 border-teal-400 border-y border-r border-y-teal-200 border-r-teal-200 text-slate-800 rounded-bl-sm",
        )}>
          {message.content === "" ? <TypingDots /> : isUser ? message.content : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <p className="font-bold text-base text-slate-800 mb-1">{children}</p>,
                h2: ({ children }) => <p className="font-bold text-sm text-slate-800 mb-1">{children}</p>,
                h3: ({ children }) => <p className="font-semibold text-sm text-slate-700 mb-0.5">{children}</p>,
                p:  ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
                em:     ({ children }) => <em className="italic text-slate-600">{children}</em>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-1.5 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-1.5 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="text-slate-700">{children}</li>,
                code: ({ children }) => <code className="rounded bg-black/[0.06] px-1 py-0.5 text-[12px] font-mono text-slate-700">{children}</code>,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2 rounded-xl border border-black/[0.08]">
                    <table className="w-full text-xs border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-slate-100/80">{children}</thead>,
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr:    ({ children }) => <tr className="border-t border-black/[0.06]">{children}</tr>,
                th:    ({ children }) => <th className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">{children}</th>,
                td:    ({ children }) => <td className="px-3 py-2 text-slate-700">{children}</td>,
                hr:    () => <hr className="my-2 border-black/[0.08]" />,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-blue-300 pl-3 italic text-slate-500 my-1">{children}</blockquote>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>

      {/* Transaction widget — attached below AI message */}
      {!isUser && message.pendingTxn && (
        <div className="ml-6">
          <TransactionWidget
            data={message.pendingTxn}
            saved={!!message.txnSaved}
            onOpen={() => onOpenTxn(message.id)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ChatPanel() {
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [input,         setInput]         = useState("");
  const [isStreaming,   setIsStreaming]   = useState(false);
  const [openTxnMsgId,  setOpenTxnMsgId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // ── Load chat history ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/chat-history")
      .then((r) => r.json())
      .then((data: { _id: string; role: "user" | "assistant"; content: string; source?: "web" | "telegram" }[]) => {
        setMessages(data.map((m) => ({ id: m._id, role: m.role, content: m.content, source: m.source ?? "web" })));
        setHistoryLoaded(true);
      })
      .catch(() => setHistoryLoaded(true));
  }, []);

  useEffect(() => {
    if (historyLoaded) bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [historyLoaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isStreaming) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    fetch("/api/chat-history", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user", content }),
    }).catch(() => {});

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    let fullResponse = "";

    try {
      const history = messages
        .filter((m) => m.source !== "telegram")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader     = res.body!.getReader();
      const decoder    = new TextDecoder();
      let   lineBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as
              | { t: "action";          label: string; intent: unknown }
              | { t: "new_transaction"; data: NewTransactionData }
              | { t: "bucket_op_done";  bucketName: string; amount: number; direction: "add" | "remove"; newBalance?: number }
              | { t: "token";           v: string }
              | { t: "error";           msg: string };

            if (event.t === "action") {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantId
                  ? { ...m, actionInfo: { label: event.label, intent: event.intent } }
                  : m
              ));
            } else if (event.t === "new_transaction") {
              // Attach to the message itself — widget stays in chat
              setMessages((prev) => prev.map((m) =>
                m.id === assistantId ? { ...m, pendingTxn: event.data } : m
              ));
              setOpenTxnMsgId(assistantId);
            } else if (event.t === "bucket_op_done") {
              // Refresh savings page and any balance-showing component
              window.dispatchEvent(new CustomEvent("owl:transaction:created"));
            } else if (event.t === "token") {
              fullResponse += event.v;
              setMessages((prev) => prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + event.v } : m
              ));
            } else if (event.t === "error") {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantId ? { ...m, content: event.msg } : m
              ));
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch {
      setMessages((prev) => prev.map((m) =>
        m.id === assistantId
          ? { ...m, content: "Couldn't reach Owl. Is Ollama running?" }
          : m
      ));
    } finally {
      setIsStreaming(false);
      if (fullResponse) {
        fetch("/api/chat-history", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "assistant", content: fullResponse }),
        }).catch(() => {});
      }
    }
  };

  // ── Save transaction ───────────────────────────────────────────────────────
  const handleTransactionSave = async (data: NewTransactionData) => {
    await fetch("/api/transactions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    // Mark the message widget as saved
    setMessages((prev) => prev.map((m) =>
      m.id === openTxnMsgId ? { ...m, txnSaved: true } : m
    ));
    setOpenTxnMsgId(null);

    // Notify other pages to refresh
    window.dispatchEvent(new CustomEvent("owl:transaction:created"));

    const confirmMsg: Message = {
      id:      crypto.randomUUID(),
      role:    "assistant",
      content: `✅ Saved — ₹${data.amount.toLocaleString("en-IN")} · ${data.description} · ${data.category}`,
    };
    setMessages((prev) => [...prev, confirmMsg]);
    fetch("/api/chat-history", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "assistant", content: confirmMsg.content }),
    }).catch(() => {});
  };

  // ── Active transaction data for open modal ─────────────────────────────────
  const activeTxnData = openTxnMsgId
    ? messages.find((m) => m.id === openTxnMsgId)?.pendingTxn ?? null
    : null;

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <aside className="glass-strong flex h-full w-[420px] shrink-0 flex-col border-l border-white/60">
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.05]">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-blue-400" />
            <span className="text-sm font-semibold text-slate-700">Ask Owl</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 tracking-wide">deepseek-r1 · rag enabled</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto px-4 py-4 flex flex-col gap-3">
          {messages.length === 0 && historyLoaded ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
              <div>
                <p className="text-3xl mb-2">🦉</p>
                <p className="text-sm font-medium text-slate-700">What&apos;s on your mind?</p>
                <p className="text-xs text-slate-400 mt-1">
                  Ask about spends, add transactions, or get tax tips
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="w-full text-left rounded-xl px-3.5 py-2.5 text-xs text-slate-600 glass-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onOpenTxn={(id) => setOpenTxnMsgId(id)}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-black/[0.04]">
          <div className="flex items-center gap-2 rounded-2xl bg-white/90 border border-black/[0.08] px-4 py-3 shadow-sm focus-within:border-blue-300 focus-within:shadow-md focus-within:shadow-blue-50 transition-all duration-200">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about your finances…"
              disabled={isStreaming}
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-300 outline-none min-w-0"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isStreaming || !input.trim()}
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-xl transition-all duration-150",
                input.trim() && !isStreaming
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                  : "bg-slate-100 text-slate-300"
              )}
            >
              <Send size={12} strokeWidth={2.5} />
            </button>
          </div>
          <p className="text-[10px] text-slate-300 text-center mt-2">
            Enter to send · datetime injected
          </p>
        </div>
      </aside>

      {activeTxnData && (
        <NewTransactionModal
          initialData={activeTxnData}
          onClose={() => setOpenTxnMsgId(null)}
          onSave={handleTransactionSave}
        />
      )}
    </>
  );
}
