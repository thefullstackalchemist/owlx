"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, TrendingUp, TrendingDown, ArrowUpDown, CreditCard, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { CATEGORY_META } from "@/constants";
import NewTransactionModal from "@/components/transactions/NewTransactionModal";
import NewRecurringModal from "@/components/transactions/NewRecurringModal";
import TransactionDetailModal from "@/components/transactions/TransactionDetailModal";
import TransactionFilters, { FilterState, defaultFilters } from "@/components/transactions/TransactionFilters";
import type { NewTransactionData } from "@/services/chatService";

interface Account {
  _id:      string;
  name:     string;
  bank:     string;
  type:     string;
  lastFour?: string;
  isCredit: boolean;
  color:    string;
}

interface Transaction {
  _id:            string;
  date:           string;
  amount:         number;
  type:           "income" | "expense" | "transfer";
  category:       string;
  description:    string;
  platform?:      string;
  accountId?:     Account;
  needsRepayment: boolean;
  needsReview:    boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatAmount(amount: number, type: string) {
  const formatted = amount.toLocaleString("en-IN");
  return type === "income" ? `+₹${formatted}` : type === "expense" ? `-₹${formatted}` : `₹${formatted}`;
}

export default function TransactionsPage() {
  const [transactions,       setTransactions]       = useState<Transaction[]>([]);
  const [loading,            setLoading]            = useState(true);
  const [filters,            setFilters]            = useState<FilterState>(defaultFilters());
  const [showModal,          setShowModal]          = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [detailTxn,          setDetailTxn]          = useState<Transaction | null>(null);
  const [deletingId,         setDeletingId]         = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();

    if (filters.mode === "custom") {
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo)   params.set("dateTo",   filters.dateTo);
    } else if (filters.preset && filters.preset !== "all") {
      params.set("period", filters.preset);
    }

    if (filters.type)      params.set("type",      filters.type);
    if (filters.category)  params.set("category",  filters.category);
    if (filters.accountId) params.set("accountId", filters.accountId);

    const res  = await fetch(`/api/transactions?${params}`);
    const data = await res.json() as Transaction[];
    setTransactions(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  useEffect(() => {
    window.addEventListener("owl:transaction:created", fetchTransactions);
    return () => window.removeEventListener("owl:transaction:created", fetchTransactions);
  }, [fetchTransactions]);

  const handleSave = async (data: NewTransactionData) => {
    await fetch("/api/transactions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    setShowModal(false);
    fetchTransactions();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setDetailTxn(null);
    setDeletingId(null);
    fetchTransactions();
  };

  const income   = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net      = income - expenses;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-black/[0.05]">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-slate-800">Transactions</h1>
          <p className="text-xs text-slate-400 mt-0.5">{transactions.length} entries</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRecurringModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-100 transition-colors"
          >
            <Plus size={13} strokeWidth={2.5} />
            New Recurring
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
          >
            <Plus size={13} strokeWidth={2.5} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <TransactionFilters value={filters} onChange={setFilters} />

      {/* List */}
      <div className="flex-1 overflow-auto px-8 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-1" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-2" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-3" />
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center glass-card rounded-2xl">
            <p className="text-2xl mb-2">🦉</p>
            <p className="text-sm font-medium text-slate-600">No transactions found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or add a new one</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {transactions.map((txn) => {
              const meta = CATEGORY_META[txn.category];
              return (
                <button
                  key={txn._id}
                  onClick={() => setDetailTxn(txn)}
                  className="flex items-center gap-4 w-full px-4 py-3 text-left rounded-xl glass-card hover:shadow-md transition-all duration-150 animate-fade-in-up"
                >
                  <span className="text-lg shrink-0 w-8 text-center">{meta?.emoji ?? "📦"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-slate-700 truncate">{txn.description}</p>
                      {txn.needsReview && (
                        <span title="Uncategorized — needs review">
                          <AlertCircle size={12} className="text-red-500 shrink-0" />
                        </span>
                      )}
                      {txn.needsRepayment && (
                        <CreditCard size={11} className="text-rose-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {txn.category}
                      {txn.platform   && <span className="ml-1.5 text-slate-300">· {txn.platform}</span>}
                      {txn.accountId  && <span className="ml-1.5 text-slate-300">· {txn.accountId.name}</span>}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 shrink-0">{formatDate(txn.date)}</p>
                  <p className={cn(
                    "font-mono text-sm font-semibold tabular shrink-0",
                    txn.type === "income"    ? "text-green-600"
                    : txn.type === "expense" ? "text-rose-500"
                    :                          "text-slate-500"
                  )}>
                    {formatAmount(txn.amount, txn.type)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary bar */}
      {transactions.length > 0 && (
        <div className="flex items-center gap-6 px-8 py-3 border-t border-black/[0.05] glass-card">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={13} className="text-green-500" />
            <span className="text-xs text-slate-500">Income</span>
            <span className="font-mono text-xs font-semibold text-green-600 tabular">₹{income.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown size={13} className="text-rose-500" />
            <span className="text-xs text-slate-500">Expenses</span>
            <span className="font-mono text-xs font-semibold text-rose-500 tabular">₹{expenses.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={13} className="text-slate-400" />
            <span className="text-xs text-slate-500">Net</span>
            <span className={cn("font-mono text-xs font-semibold tabular", net >= 0 ? "text-green-600" : "text-rose-500")}>
              {net >= 0 ? "+" : ""}₹{net.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      )}

      {showModal && (
        <NewTransactionModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {showRecurringModal && (
        <NewRecurringModal
          onClose={() => setShowRecurringModal(false)}
          onSave={() => {}}
        />
      )}

      {detailTxn && (
        <TransactionDetailModal
          transaction={detailTxn}
          onClose={() => setDetailTxn(null)}
          onDelete={handleDelete}
          onUpdate={() => { setDetailTxn(null); fetchTransactions(); }}
        />
      )}
    </div>
  );
}
