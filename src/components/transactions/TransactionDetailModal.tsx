"use client";

import { X, Trash2, CreditCard, Wallet, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";
import { CATEGORY_META } from "@/constants";

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
}

interface Props {
  transaction: Transaction;
  onClose:     () => void;
  onDelete:    (id: string) => Promise<void>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
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

export default function TransactionDetailModal({ transaction: txn, onClose, onDelete }: Props) {
  const meta      = CATEGORY_META[txn.category];
  const isExpense = txn.type === "expense";
  const isIncome  = txn.type === "income";

  const amountColor = isIncome ? "text-green-600" : isExpense ? "text-rose-500" : "text-slate-600";
  const amountSign  = isIncome ? "+" : isExpense ? "−" : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[400px] glass-strong rounded-3xl shadow-2xl animate-fade-in-up overflow-hidden">
        {/* Colour strip */}
        <div
          className={cn(
            "h-1.5 w-full",
            isIncome  ? "bg-green-400"
            : isExpense ? "bg-rose-400"
            :             "bg-slate-300"
          )}
        />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{meta?.emoji ?? "📦"}</span>
              <div>
                <p className="text-base font-semibold text-slate-800">{txn.description}</p>
                <p className="text-xs text-slate-400 mt-0.5">{txn.category}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-black/[0.06] text-slate-400 transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>

          {/* Amount */}
          <div className="rounded-2xl bg-slate-50 border border-black/[0.06] px-4 py-4 mb-4 text-center">
            <p className={cn("text-3xl font-bold tabular tracking-tight", amountColor)}>
              {amountSign}₹{txn.amount.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-slate-400 mt-1 capitalize">{txn.type}</p>
          </div>

          {/* Details grid */}
          <div className="flex flex-col gap-3 mb-5">
            <Row label="Date">{formatDate(txn.date)}</Row>

            {txn.platform && <Row label="Platform">{txn.platform}</Row>}

            {txn.accountId && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Source</p>
                <AccountBadge account={txn.accountId} />
              </div>
            )}

            {txn.needsRepayment && (
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
