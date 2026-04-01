"use client";

import { useState } from "react";
import { X, Trash2, CreditCard, Wallet, RefreshCw, Pencil, Check, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { CATEGORY_META, TRANSACTION_CATEGORIES } from "@/constants";

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

interface Props {
  transaction: Transaction;
  onClose:     () => void;
  onDelete:    (id: string) => Promise<void>;
  onUpdate?:   (updated: Transaction) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function toInputDate(iso: string) {
  return new Date(iso).toISOString().split("T")[0];
}

function AccountBadge({ account }: { account: Account }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: account.color + "22", border: `1.5px solid ${account.color}44` }}
      >
        {account.isCredit
          ? <CreditCard size={13} style={{ color: account.color }} />
          : <Wallet      size={13} style={{ color: account.color }} />
        }
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">
          {account.name}
          {account.lastFour && <span className="text-slate-400 font-normal ml-1">·· {account.lastFour}</span>}
        </p>
        <p className="text-[10px] text-slate-400">{account.bank}</p>
      </div>
    </div>
  );
}

export default function TransactionDetailModal({ transaction: txn, onClose, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(txn.needsReview); // auto-open edit if needs review
  const [saving,  setSaving]  = useState(false);

  const [description,    setDescription]    = useState(txn.description);
  const [category,       setCategory]       = useState(txn.category);
  const [type,           setType]           = useState(txn.type);
  const [amount,         setAmount]         = useState(txn.amount.toString());
  const [date,           setDate]           = useState(toInputDate(txn.date));
  const [platform,       setPlatform]       = useState(txn.platform ?? "");
  const [needsRepayment, setNeedsRepayment] = useState(txn.needsRepayment);

  const displayCategory = editing ? category : txn.category;
  const meta            = CATEGORY_META[displayCategory];

  const isExpense = (editing ? type : txn.type) === "expense";
  const isIncome  = (editing ? type : txn.type) === "income";
  const amountColor = isIncome ? "text-green-600" : isExpense ? "text-rose-500" : "text-slate-600";
  const amountSign  = isIncome ? "+" : isExpense ? "−" : "";

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/transactions/${txn._id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          description,
          category,
          type,
          amount:         parseFloat(amount),
          date:           new Date(date).toISOString(),
          platform:       platform || undefined,
          needsRepayment,
          needsReview:    false,
        }),
      });

      if (res.ok) {
        const updated = await res.json() as Transaction;
        onUpdate?.(updated);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDescription(txn.description);
    setCategory(txn.category);
    setType(txn.type);
    setAmount(txn.amount.toString());
    setDate(toInputDate(txn.date));
    setPlatform(txn.platform ?? "");
    setNeedsRepayment(txn.needsRepayment);
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={editing ? undefined : onClose} />

      <div className="relative w-full max-w-[400px] glass-strong rounded-3xl shadow-2xl animate-fade-in-up overflow-hidden">
        {/* Colour strip */}
        <div className={cn("h-1.5 w-full", isIncome ? "bg-green-400" : isExpense ? "bg-rose-400" : "bg-slate-300")} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{meta?.emoji ?? "📦"}</span>
              <div>
                {editing ? (
                  <input
                    className="text-base font-semibold text-slate-800 bg-transparent border-b border-slate-300 focus:border-blue-400 outline-none w-48"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                ) : (
                  <p className="text-base font-semibold text-slate-800">{txn.description}</p>
                )}
                <p className="text-xs text-slate-400 mt-0.5">{displayCategory}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
                >
                  <Pencil size={13} />
                </button>
              )}
              <button
                onClick={editing ? handleCancel : onClose}
                className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-black/[0.06] text-slate-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Needs review banner */}
          {txn.needsReview && !editing && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 mb-4">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">Auto-imported — tap <Pencil size={10} className="inline mx-0.5" /> to categorize</p>
            </div>
          )}

          {/* Amount */}
          <div className="rounded-2xl bg-slate-50 border border-black/[0.06] px-4 py-4 mb-4 text-center">
            {editing ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-slate-400 text-lg">₹</span>
                <input
                  type="number"
                  className="text-3xl font-bold tabular tracking-tight text-slate-800 bg-transparent outline-none w-40 text-center"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            ) : (
              <p className={cn("text-3xl font-bold tabular tracking-tight", amountColor)}>
                {amountSign}₹{txn.amount.toLocaleString("en-IN")}
              </p>
            )}
            {editing ? (
              <div className="flex justify-center gap-2 mt-2">
                {(["expense", "income", "transfer"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors",
                      type === t
                        ? t === "income"   ? "bg-green-100 text-green-700"
                        : t === "expense"  ? "bg-rose-100 text-rose-600"
                        :                    "bg-slate-200 text-slate-600"
                        : "bg-transparent text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-1 capitalize">{txn.type}</p>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-3 mb-5">
            {/* Date */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Date</p>
              {editing ? (
                <input
                  type="date"
                  className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              ) : (
                <p className="text-sm text-slate-700">{formatDate(txn.date)}</p>
              )}
            </div>

            {/* Category */}
            {editing && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                <select
                  className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 w-full"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {TRANSACTION_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_META[c]?.emoji} {c}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Platform */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Platform</p>
              {editing ? (
                <input
                  className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400 w-full"
                  placeholder="e.g. UPI, Swiggy…"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                />
              ) : (
                txn.platform ? <p className="text-sm text-slate-700">{txn.platform}</p> : null
              )}
            </div>

            {txn.accountId && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Source</p>
                <AccountBadge account={txn.accountId} />
              </div>
            )}

            {/* Needs repayment toggle */}
            {editing && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setNeedsRepayment((p) => !p)}
                  className={cn(
                    "w-8 h-4.5 rounded-full transition-colors relative",
                    needsRepayment ? "bg-rose-400" : "bg-slate-200"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform",
                    needsRepayment ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </div>
                <span className="text-xs text-slate-600">Credit card / needs repayment</span>
              </label>
            )}

            {!editing && txn.needsRepayment && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5">
                <RefreshCw size={13} className="text-rose-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-rose-600">Credit card payment</p>
                  <p className="text-[10px] text-rose-400 mt-0.5">This amount needs to be repaid</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-sm text-slate-500 hover:bg-black/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-60"
              >
                <Check size={13} />
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-sm text-slate-500 hover:bg-black/[0.04] transition-colors"
              >
                Close
              </button>
              <button
                onClick={async () => { await onDelete(txn._id); onClose(); }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-100 transition-colors"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-slate-700">{children}</p>
    </div>
  );
}
