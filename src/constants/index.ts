export const APP_NAME = "OWL";
export const APP_FULL_NAME = "Outstanding Wealth Ledger";

export const CURRENCY = "₹";
export const LOCALE = "en-IN";

export const OLLAMA_URL   = process.env.OLLAMA_URL   ?? "http://localhost:11434";
export const MATH_MODEL   = process.env.MATH_MODEL   ?? "deepseek-r1:8b";
export const ANALYSIS_MODEL = process.env.ANALYSIS_MODEL ?? "llama3.2:latest";
export const EMBED_MODEL  = process.env.EMBED_MODEL  ?? "nomic-embed-text";

// ─── Categories ───────────────────────────────────────────────────────────────

export const TRANSACTION_CATEGORIES = [
  // Expenses
  "Food & Dining",
  "Groceries",
  "Transport",
  "Fuel",
  "Shopping",
  "Entertainment",
  "Health & Medical",
  "Utilities",
  "Rent",
  "Education",
  "Travel",
  "Subscriptions",
  "Personal Care",
  "Gifts",
  // Income
  "Salary",
  "Freelance",
  "Investment Returns",
  "Business Income",
  // Neutral
  "Savings",
  "Transfer",
  "Other",
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const CATEGORY_META: Record<string, { emoji: string; defaultType: "income" | "expense" | "transfer" }> = {
  "Food & Dining":      { emoji: "🍽️", defaultType: "expense" },
  "Groceries":          { emoji: "🛒", defaultType: "expense" },
  "Transport":          { emoji: "🚌", defaultType: "expense" },
  "Fuel":               { emoji: "⛽", defaultType: "expense" },
  "Shopping":           { emoji: "🛍️", defaultType: "expense" },
  "Entertainment":      { emoji: "🎬", defaultType: "expense" },
  "Health & Medical":   { emoji: "🏥", defaultType: "expense" },
  "Utilities":          { emoji: "💡", defaultType: "expense" },
  "Rent":               { emoji: "🏠", defaultType: "expense" },
  "Education":          { emoji: "📚", defaultType: "expense" },
  "Travel":             { emoji: "✈️", defaultType: "expense" },
  "Subscriptions":      { emoji: "📱", defaultType: "expense" },
  "Personal Care":      { emoji: "💆", defaultType: "expense" },
  "Gifts":              { emoji: "🎁", defaultType: "expense" },
  "Salary":             { emoji: "💰", defaultType: "income"  },
  "Freelance":          { emoji: "💻", defaultType: "income"  },
  "Investment Returns": { emoji: "📈", defaultType: "income"  },
  "Business Income":    { emoji: "🏢", defaultType: "income"  },
  "Savings":            { emoji: "🪣", defaultType: "income"  },
  "Transfer":           { emoji: "↔️", defaultType: "transfer"},
  "Other":              { emoji: "📦", defaultType: "expense" },
};
