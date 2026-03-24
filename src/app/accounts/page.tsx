"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, CreditCard, Wallet, Smartphone, ChevronDown,
  Trash2, Landmark, Pencil, X, Check,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { AccountType, CardNetwork, UpiApp } from "@/models/Account";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Account {
  _id:       string;
  name:      string;
  bank:      string;
  type:      AccountType;
  parentId?: string;
  lastFour?: string;
  network?:  CardNetwork;
  upiId?:    string;
  upiApp?:   UpiApp;
  balance?:  number;
  isCredit:  boolean;
  color:     string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NETWORKS: CardNetwork[] = ["Visa", "Mastercard", "RuPay", "Amex", "Diners"];
const UPI_APPS: UpiApp[]      = ["Google Pay", "PhonePe", "Paytm", "BHIM", "Amazon Pay", "Other"];

const COLOR_MAP: Record<AccountType, string> = {
  savings:     "#6366f1",
  current:     "#0ea5e9",
  credit_card: "#f43f5e",
  debit_card:  "#10b981",
  upi:         "#8b5cf6",
  wallet:      "#f59e0b",
};

const POPULAR_WALLETS = [
  "BigBasket", "Country Delight", "Amazon Pay", "Paytm", "PhonePe",
  "Ola Money", "MobiKwik", "Freecharge", "JioMoney", "Airtel Money",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function typeIcon(type: AccountType, size = 14, color?: string) {
  const style = color ? { color } : {};
  if (type === "credit_card" || type === "debit_card") return <CreditCard size={size} style={style} />;
  if (type === "upi")                                   return <Smartphone  size={size} style={style} />;
  if (type === "wallet")                                return <Wallet      size={size} style={style} />;
  return <Landmark size={size} style={style} />;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiCreate(data: object) {
  return fetch("/api/accounts", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
async function apiUpdate(id: string, data: object) {
  return fetch(`/api/accounts/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
async function apiDelete(id: string) {
  return fetch(`/api/accounts/${id}`, { method: "DELETE" });
}

// ─── Mini forms ───────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
        {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = "w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300 transition-colors";
const SELECT = INPUT;

// ── Bank account form ─────────────────────────────────────────────────────────
function BankForm({ initial, onSave, onCancel }: {
  initial?: Partial<Account>;
  onSave: (d: object) => Promise<void>;
  onCancel: () => void;
}) {
  const [name,     setName]     = useState(initial?.name     ?? "");
  const [bank,     setBank]     = useState(initial?.bank     ?? "");
  const [type,     setType]     = useState<"savings" | "current">(
    (initial?.type as "savings" | "current") ?? "savings"
  );
  const [lastFour, setLastFour] = useState(initial?.lastFour ?? "");
  const [balance,  setBalance]  = useState(initial?.balance?.toString() ?? "");
  const [saving,   setSaving]   = useState(false);

  const submit = async () => {
    if (!name.trim() || !bank.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(), bank: bank.trim(), type,
      lastFour: lastFour || undefined,
      balance:  balance ? Number(balance) : 0,
      color: initial?.color ?? COLOR_MAP[type],
    });
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-slate-50/60 p-4 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Account name" required>
          <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HDFC Savings" />
        </Field>
        <Field label="Bank" required>
          <input className={INPUT} value={bank} onChange={(e) => setBank(e.target.value)} placeholder="e.g. HDFC, SBI" />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Type" required>
          <select className={SELECT} value={type} onChange={(e) => setType(e.target.value as "savings" | "current")}>
            <option value="savings">Savings</option>
            <option value="current">Current</option>
          </select>
        </Field>
        <Field label="Last 4 digits (optional)">
          <input className={INPUT + " font-mono tracking-widest"} value={lastFour}
            onChange={(e) => setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="1234" maxLength={4} />
        </Field>
        <Field label="Starting balance (₹)">
          <div className="flex items-center gap-1 rounded-xl border border-black/[0.08] bg-white px-3 py-2">
            <span className="text-sm text-slate-400">₹</span>
            <input type="number" className="flex-1 bg-transparent text-sm text-slate-700 outline-none"
              value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" />
          </div>
        </Field>
      </div>
      <FormActions onCancel={onCancel} onSave={submit} saving={saving} disabled={!name.trim() || !bank.trim()} />
    </div>
  );
}

// ── Card form ─────────────────────────────────────────────────────────────────
function CardForm({ parentId, onSave, onCancel }: {
  parentId: string;
  onSave: (d: object) => Promise<void>;
  onCancel: () => void;
}) {
  const [name,     setName]     = useState("");
  const [type,     setType]     = useState<"debit_card" | "credit_card">("debit_card");
  const [lastFour, setLastFour] = useState("");
  const [network,  setNetwork]  = useState<CardNetwork>("Visa");
  const [saving,   setSaving]   = useState(false);

  const submit = async () => {
    if (!name.trim() || !lastFour) return;
    setSaving(true);
    await onSave({ name: name.trim(), type, lastFour, network, parentId, bank: "", color: COLOR_MAP[type] });
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white p-3 flex flex-col gap-2.5">
      <p className="text-xs font-semibold text-slate-600">Add Card</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Card name" required>
          <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Millennia" />
        </Field>
        <Field label="Last 4 digits" required>
          <input className={INPUT + " font-mono tracking-widest"} value={lastFour}
            onChange={(e) => setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="1234" maxLength={4} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Type" required>
          <select className={SELECT} value={type} onChange={(e) => setType(e.target.value as "debit_card" | "credit_card")}>
            <option value="debit_card">Debit Card</option>
            <option value="credit_card">Credit Card</option>
          </select>
        </Field>
        <Field label="Network" required>
          <select className={SELECT} value={network} onChange={(e) => setNetwork(e.target.value as CardNetwork)}>
            {NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
      </div>
      <FormActions onCancel={onCancel} onSave={submit} saving={saving} disabled={!name.trim() || lastFour.length < 4} />
    </div>
  );
}

// ── UPI form ──────────────────────────────────────────────────────────────────
function UpiForm({ parentId, bank, onSave, onCancel }: {
  parentId: string; bank: string;
  onSave: (d: object) => Promise<void>;
  onCancel: () => void;
}) {
  const [upiId,  setUpiId]  = useState("");
  const [upiApp, setUpiApp] = useState<UpiApp>("Google Pay");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!upiId.trim()) return;
    setSaving(true);
    await onSave({ name: upiApp, bank, type: "upi", upiId: upiId.trim(), upiApp, parentId, color: COLOR_MAP.upi });
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white p-3 flex flex-col gap-2.5">
      <p className="text-xs font-semibold text-slate-600">Add UPI</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="UPI ID" required>
          <input className={INPUT} value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="9876@hdfcbank" />
        </Field>
        <Field label="App" required>
          <select className={SELECT} value={upiApp} onChange={(e) => setUpiApp(e.target.value as UpiApp)}>
            {UPI_APPS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
      </div>
      <FormActions onCancel={onCancel} onSave={submit} saving={saving} disabled={!upiId.trim()} />
    </div>
  );
}

// ── Wallet form ───────────────────────────────────────────────────────────────
function WalletForm({ onSave, onCancel }: {
  onSave: (d: object) => Promise<void>;
  onCancel: () => void;
}) {
  const [name,    setName]    = useState("");
  const [balance, setBalance] = useState("");
  const [saving,  setSaving]  = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), bank: name.trim(), type: "wallet",
      balance: balance ? Number(balance) : 0, color: COLOR_MAP.wallet });
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-slate-50/60 p-4 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Wallet name" required>
          <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BigBasket" list="wallets-list" />
          <datalist id="wallets-list">
            {POPULAR_WALLETS.map((w) => <option key={w} value={w} />)}
          </datalist>
        </Field>
        <Field label="Balance (₹)">
          <div className="flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white px-3 py-2">
            <span className="text-sm text-slate-400">₹</span>
            <input type="number" className="flex-1 bg-transparent text-sm text-slate-700 outline-none"
              value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" />
          </div>
        </Field>
      </div>
      <FormActions onCancel={onCancel} onSave={submit} saving={saving} disabled={!name.trim()} />
    </div>
  );
}

// ── Shared form actions ───────────────────────────────────────────────────────
function FormActions({ onCancel, onSave, saving, disabled }: {
  onCancel: () => void; onSave: () => void; saving: boolean; disabled: boolean;
}) {
  return (
    <div className="flex gap-2">
      <button onClick={onCancel} className="flex-1 rounded-xl border border-black/[0.08] py-2 text-xs text-slate-500 hover:bg-black/[0.04] transition-colors">
        <X size={11} className="inline mr-1" />Cancel
      </button>
      <button onClick={onSave} disabled={saving || disabled}
        className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
        <Check size={11} className="inline mr-1" />{saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

// ─── Card chip ────────────────────────────────────────────────────────────────
function CardChip({ account, onDelete }: { account: Account; onDelete: () => void }) {
  const c = account.color;
  return (
    <div className="relative group flex flex-col gap-1.5 rounded-2xl border p-3 transition-shadow hover:shadow-md"
      style={{ borderColor: c + "44", background: c + "0d" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {typeIcon(account.type, 12, c)}
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c }}>
            {account.type === "credit_card" ? "Credit" : account.type === "debit_card" ? "Debit" : "UPI"}
          </span>
        </div>
        <button onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all">
          <Trash2 size={11} />
        </button>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 truncate">
          {account.upiId ?? account.name}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {account.upiApp ?? (account.network && account.lastFour ? `${account.network} ···· ${account.lastFour}` : account.lastFour ? `···· ${account.lastFour}` : "")}
        </p>
      </div>
    </div>
  );
}

// ─── Bank accordion ───────────────────────────────────────────────────────────
function BankAccordion({
  bank, children: cards, upiItems, onAddCard, onAddUpi, onDeleteBank, onDeleteChild,
}: {
  bank:          Account;
  children:      Account[];   // cards
  upiItems:      Account[];
  onAddCard:     () => void;
  onAddUpi:      () => void;
  onDeleteBank:  () => void;
  onDeleteChild: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const c = bank.color;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: c + "33" }}>
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors hover:bg-black/[0.02]"
        style={{ background: c + "0a" }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: c + "22" }}>
          <Landmark size={16} style={{ color: c }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{bank.name}</p>
          <p className="text-[11px] text-slate-400">{bank.bank}{bank.lastFour ? ` ···· ${bank.lastFour}` : ""}</p>
        </div>
        {bank.balance !== undefined && (
          <span className="text-xs font-mono font-semibold" style={{ color: c }}>
            ₹{bank.balance.toLocaleString("en-IN")}
          </span>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-slate-400">
            {cards.length + upiItems.length} linked
          </span>
          <button onClick={(e) => { e.stopPropagation(); onDeleteBank(); }}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all">
            <Trash2 size={12} />
          </button>
          <ChevronDown size={14} className={cn("text-slate-400 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 py-4 border-t border-black/[0.05] flex flex-col gap-4">
          {/* Cards row */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cards</p>
              <button onClick={onAddCard}
                className="flex items-center gap-1 text-[10px] font-medium text-indigo-500 hover:text-indigo-700 transition-colors">
                <Plus size={10} />Add card
              </button>
            </div>
            {cards.length === 0 ? (
              <p className="text-xs text-slate-300 italic">No cards linked yet</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cards.map((card) => (
                  <CardChip key={card._id} account={card} onDelete={() => onDeleteChild(card._id)} />
                ))}
              </div>
            )}
          </div>

          {/* UPI row */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">UPI</p>
              <button onClick={onAddUpi}
                className="flex items-center gap-1 text-[10px] font-medium text-violet-500 hover:text-violet-700 transition-colors">
                <Plus size={10} />Add UPI
              </button>
            </div>
            {upiItems.length === 0 ? (
              <p className="text-xs text-slate-300 italic">No UPI handles linked yet</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {upiItems.map((upi) => (
                  <CardChip key={upi._id} account={upi} onDelete={() => onDeleteChild(upi._id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Wallet chip ──────────────────────────────────────────────────────────────
function WalletChip({ account, onDelete }: { account: Account; onDelete: () => void }) {
  const c = account.color;
  return (
    <div className="relative group flex flex-col gap-2 rounded-2xl border p-4 hover:shadow-md transition-shadow"
      style={{ borderColor: c + "44", background: c + "0d" }}>
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c + "22" }}>
          <Wallet size={16} style={{ color: c }} />
        </div>
        <button onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all">
          <Trash2 size={12} />
        </button>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{account.name}</p>
        {account.balance !== undefined && account.balance > 0 && (
          <p className="text-xs font-mono font-semibold mt-0.5" style={{ color: c }}>
            ₹{account.balance.toLocaleString("en-IN")}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type AddingState =
  | { type: "bank" }
  | { type: "card";   parentId: string; bank: string }
  | { type: "upi";    parentId: string; bank: string }
  | { type: "wallet" }
  | null;

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [adding,   setAdding]   = useState<AddingState>(null);

  const load = useCallback(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d: Account[]) => { setAccounts(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group data
  const banks   = accounts.filter((a) => a.type === "savings" || a.type === "current");
  const cards   = accounts.filter((a) => a.type === "credit_card" || a.type === "debit_card");
  const upis    = accounts.filter((a) => a.type === "upi");
  const wallets = accounts.filter((a) => a.type === "wallet");

  const cardsFor = (bankId: string)  => cards.filter((c) => c.parentId === bankId);
  const upisFor  = (bankId: string)  => upis.filter((u)  => u.parentId === bankId);

  const handleCreate = async (data: object) => {
    await apiCreate(data);
    setAdding(null);
    load();
  };
  const handleDelete = async (id: string) => {
    await apiDelete(id);
    load();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-black/[0.05]">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-slate-800">Accounts & Cards</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {banks.length} bank{banks.length !== 1 ? "s" : ""} · {cards.length} card{cards.length !== 1 ? "s" : ""} · {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdding({ type: "wallet" })}
            className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-100 transition-colors"
          >
            <Plus size={12} />Wallet
          </button>
          <button
            onClick={() => setAdding({ type: "bank" })}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus size={12} />Add Bank
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6 flex flex-col gap-8">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-1" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-2" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-3" />
            </div>
          </div>
        ) : (
          <>
            {/* ── Banks & Cards ────────────────────────────────────────── */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Banks & Cards</p>

              {adding?.type === "bank" && (
                <div className="mb-4">
                  <BankForm onSave={handleCreate} onCancel={() => setAdding(null)} />
                </div>
              )}

              {banks.length === 0 && adding?.type !== "bank" ? (
                <div className="flex flex-col items-center justify-center h-32 glass-card rounded-2xl text-center">
                  <p className="text-xl mb-1">🏦</p>
                  <p className="text-sm font-medium text-slate-600">No banks added yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">Click "Add Bank" to get started</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {banks.map((bank) => (
                    <div key={bank._id}>
                      <BankAccordion
                        bank={bank}
                        children={cardsFor(bank._id)}
                        upiItems={upisFor(bank._id)}
                        onAddCard={() => setAdding({ type: "card", parentId: bank._id, bank: bank.bank })}
                        onAddUpi={() => setAdding({ type: "upi", parentId: bank._id, bank: bank.bank })}
                        onDeleteBank={() => handleDelete(bank._id)}
                        onDeleteChild={(id) => handleDelete(id)}
                      />
                      {adding?.type === "card" && adding.parentId === bank._id && (
                        <div className="mt-2">
                          <CardForm parentId={bank._id} onSave={handleCreate} onCancel={() => setAdding(null)} />
                        </div>
                      )}
                      {adding?.type === "upi" && adding.parentId === bank._id && (
                        <div className="mt-2">
                          <UpiForm parentId={bank._id} bank={bank.bank} onSave={handleCreate} onCancel={() => setAdding(null)} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Wallets ──────────────────────────────────────────────── */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Wallets</p>

              {adding?.type === "wallet" && (
                <div className="mb-4">
                  <WalletForm onSave={handleCreate} onCancel={() => setAdding(null)} />
                </div>
              )}

              {wallets.length === 0 && adding?.type !== "wallet" ? (
                <div className="flex flex-col items-center justify-center h-28 glass-card rounded-2xl text-center">
                  <p className="text-xl mb-1">👛</p>
                  <p className="text-sm font-medium text-slate-600">No wallets yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">BigBasket, Country Delight, Amazon Pay…</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {wallets.map((w) => (
                    <WalletChip key={w._id} account={w} onDelete={() => handleDelete(w._id)} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
