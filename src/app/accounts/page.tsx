"use client";

import { useEffect, useState } from "react";
import { Plus, CreditCard, Wallet, Pencil, Trash2, X, Check } from "lucide-react";
import { cn } from "@/utils/cn";

type AccountType = "savings" | "current" | "credit_card" | "debit_card" | "wallet" | "upi";

interface Account {
  _id:       string;
  name:      string;
  bank:      string;
  type:      AccountType;
  lastFour?: string;
  isCredit:  boolean;
  color:     string;
}

const TYPE_LABELS: Record<AccountType, string> = {
  savings:     "Savings Account",
  current:     "Current Account",
  credit_card: "Credit Card",
  debit_card:  "Debit Card",
  wallet:      "Wallet",
  upi:         "UPI / Payment App",
};

const TYPE_COLORS: Record<AccountType, string> = {
  savings:     "#6366f1",
  current:     "#0ea5e9",
  credit_card: "#f43f5e",
  debit_card:  "#10b981",
  wallet:      "#f59e0b",
  upi:         "#8b5cf6",
};

const BLANK = { name: "", bank: "", type: "savings" as AccountType, lastFour: "", color: TYPE_COLORS.savings };

function AccountCard({ account, onEdit, onDelete }: { account: Account; onEdit: () => void; onDelete: () => void }) {
  return (
    <div
      className="relative rounded-2xl p-4 border flex flex-col gap-3 transition-shadow hover:shadow-md"
      style={{ borderColor: account.color + "44", backgroundColor: account.color + "0d" }}
    >
      {/* Type chip */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ backgroundColor: account.color + "22", color: account.color }}
        >
          {TYPE_LABELS[account.type]}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-black/[0.06] text-slate-400 transition-colors">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Icon + details */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: account.color + "22" }}
        >
          {account.isCredit
            ? <CreditCard size={18} style={{ color: account.color }} />
            : <Wallet      size={18} style={{ color: account.color }} />
          }
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{account.name}</p>
          <p className="text-xs text-slate-500">{account.bank}{account.lastFour && ` ···· ${account.lastFour}`}</p>
        </div>
      </div>

      {account.isCredit && (
        <div className="text-[10px] font-medium text-rose-500 flex items-center gap-1">
          <CreditCard size={9} /> Credit — repayment tracked
        </div>
      )}
    </div>
  );
}

interface FormState { name: string; bank: string; type: AccountType; lastFour: string; color: string; }

function AccountForm({
  initial, onSave, onCancel,
}: {
  initial?: FormState;
  onSave: (data: FormState) => Promise<void>;
  onCancel: () => void;
}) {
  const [form,   setForm]   = useState<FormState>(initial ?? BLANK);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof FormState, v: string) => {
    setForm((f) => ({
      ...f, [k]: v,
      ...(k === "type" ? { color: TYPE_COLORS[v as AccountType] } : {}),
    }));
  };

  const submit = async () => {
    if (!form.name.trim() || !form.bank.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white/80 p-4 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Name</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. HDFC Salary"
            className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Bank / Provider</label>
          <input
            value={form.bank}
            onChange={(e) => set("bank", e.target.value)}
            placeholder="e.g. HDFC, SBI, Paytm"
            className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300"
          >
            {(Object.keys(TYPE_LABELS) as AccountType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Last 4 digits <span className="normal-case text-slate-300">(optional)</span>
          </label>
          <input
            value={form.lastFour}
            onChange={(e) => set("lastFour", e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="1234"
            maxLength={4}
            className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300 font-mono tracking-widest"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 rounded-xl border border-black/[0.08] py-2 text-xs text-slate-500 hover:bg-black/[0.04] transition-colors">
          <X size={12} className="inline mr-1" />Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving || !form.name.trim() || !form.bank.trim()}
          className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Check size={12} className="inline mr-1" />{saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const [accounts,   setAccounts]   = useState<Account[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<Account | null>(null);

  const load = () => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d: Account[]) => { setAccounts(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data: FormState) => {
    await fetch("/api/accounts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, lastFour: data.lastFour || undefined }),
    });
    setShowForm(false);
    load();
  };

  const handleEdit = async (data: FormState) => {
    if (!editTarget) return;
    await fetch(`/api/accounts/${editTarget._id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, lastFour: data.lastFour || undefined }),
    });
    setEditTarget(null);
    load();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-black/[0.05]">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-slate-800">Accounts & Cards</h1>
          <p className="text-xs text-slate-400 mt-0.5">{accounts.length} linked</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditTarget(null); }}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus size={13} strokeWidth={2.5} />
          Add Account
        </button>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        {(showForm && !editTarget) && (
          <div className="mb-6">
            <AccountForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-1" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-2" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-3" />
            </div>
          </div>
        ) : accounts.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center h-48 text-center glass-card rounded-2xl">
            <p className="text-2xl mb-2">🏦</p>
            <p className="text-sm font-medium text-slate-600">No accounts yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your bank accounts and cards to track spending sources</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              editTarget?._id === acc._id ? (
                <div key={acc._id} className="sm:col-span-2 lg:col-span-3">
                  <AccountForm
                    initial={{ name: acc.name, bank: acc.bank, type: acc.type, lastFour: acc.lastFour ?? "", color: acc.color }}
                    onSave={handleEdit}
                    onCancel={() => setEditTarget(null)}
                  />
                </div>
              ) : (
                <AccountCard
                  key={acc._id}
                  account={acc}
                  onEdit={() => { setEditTarget(acc); setShowForm(false); }}
                  onDelete={() => handleDelete(acc._id)}
                />
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
