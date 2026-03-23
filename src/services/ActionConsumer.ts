import { queryTransactions, formatTransactionsForAI } from "./transactions";
import type { ChatIntent, NewTransactionData } from "./chatService";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActionResult {
  label: string;
  intent: ChatIntent;
  data: string;
  /** Present only for add_transaction — prefills the modal */
  newTransaction?: NewTransactionData;
}

interface ActionHandler {
  getLabel(intent: ChatIntent): string;
  execute(intent: ChatIntent): Promise<string>;
}

// ─── Period labels ────────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<string, string> = {
  this_month:  "this month",
  last_month:  "last month",
  this_year:   "this year",
  last_7_days: "the last 7 days",
  all:         "all time",
};

// ─── ActionConsumer class ─────────────────────────────────────────────────────

class ActionConsumer {
  private registry = new Map<string, ActionHandler>();

  register(action: string, handler: ActionHandler): this {
    this.registry.set(action, handler);
    return this;
  }

  async consume(intent: ChatIntent): Promise<ActionResult | null> {
    if (intent.action === "general") return null;

    const handler = this.registry.get(intent.action);
    if (!handler) return null;

    const label = handler.getLabel(intent);
    const data  = await handler.execute(intent);

    const result: ActionResult = { label, intent, data };
    if (intent.action === "add_transaction" && intent.newTransaction) {
      result.newTransaction = intent.newTransaction;
    }

    return result;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const actionConsumer = new ActionConsumer();

// ─── query_transactions ───────────────────────────────────────────────────────

actionConsumer.register("query_transactions", {
  getLabel(intent) {
    const { period, type, category } = intent.filters;
    const periodStr   = period   ? (PERIOD_LABELS[period] ?? period) : "all time";
    const typeStr     = type     ? ` ${type}s`            : "";
    const categoryStr = category ? ` · ${category}`       : "";
    return `Fetching${typeStr} transactions for ${periodStr}${categoryStr}…`;
  },

  async execute(intent) {
    const txns = await queryTransactions(intent.filters);
    return formatTransactionsForAI(txns);
  },
});

// ─── add_transaction ──────────────────────────────────────────────────────────

actionConsumer.register("add_transaction", {
  getLabel(intent) {
    const t = intent.newTransaction;
    if (!t) return "Preparing transaction…";
    return `Preparing ₹${t.amount.toLocaleString("en-IN")} · ${t.description} · ${t.category}`;
  },

  async execute(intent) {
    const t = intent.newTransaction;
    if (!t) return "Could not extract transaction details.";
    return [
      `Transaction ready to save:`,
      `  Amount: ₹${t.amount.toLocaleString("en-IN")}`,
      `  Type: ${t.type}`,
      `  Category: ${t.category}`,
      `  Description: ${t.description}`,
      `  Date: ${t.date}`,
    ].join("\n");
  },
});
