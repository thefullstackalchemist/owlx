"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, CreditCard, Wallet, Smartphone, ChevronDown,
  Trash2, Landmark, X, Check,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { AccountType, CardNetwork, UpiApp } from "@/models/Account";
import type { CardType } from "@/models/Card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BankAccount {
  _id:       string;
  name:      string;
  bank:      string;
  type:      "savings" | "current";
  lastFour?: string;
  balance?:  number;
  color:     string;
}

interface UpiAccount {
  _id:      string;
  name:     string;
  bank:     string;
  type:     "upi";
  parentId: string;
  upiId?:   string;
  upiApp?:  UpiApp;
  color:    string;
}

interface CardItem {
  _id:          string;
  name:         string;
  bank:         string;
  type:         CardType;
  parentId?:    string;
  lastFour?:    string;
  network?:     CardNetwork;
  balance?:     number;
  creditLimit?: number;
  isCredit:     boolean;
  color:        string;
}

interface WalletItem {
  _id:     string;
  name:    string;
  balance: number;
  color:   string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NETWORKS: CardNetwork[] = ["Visa", "Mastercard", "RuPay", "Amex", "Diners"];
const UPI_APPS: UpiApp[]      = ["Google Pay", "PhonePe", "Paytm", "BHIM", "Amazon Pay", "Other"];

const POPULAR_WALLETS = [
  "BigBasket", "Country Delight", "Amazon Pay", "Paytm", "PhonePe",
  "Ola Money", "MobiKwik", "Freecharge", "JioMoney", "Airtel Money",
];

const BANK_COLOR_MAP: Record<"savings" | "current", string> = {
  savings: "#6366f1",
  current: "#0ea5e9",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function typeIcon(type: AccountType | CardType, size = 14, color?: string) {
  const style = color ? { color } : {};
  if (type === "credit_card" || type === "debit_card") return <CreditCard size={size} style={style} />;
  if (type === "upi")                                   return <Smartphone  size={size} style={style} />;
  if (type === "wallet")                                return <Wallet      size={size} style={style} />;
  return <Landmark size={size} style={style} />;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function post(url: string, data: object) {
  return fetch(url, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
async function del(url: string) {
  return fetch(url, { method: "DELETE" });
}

// ─── Field / form primitives ──────────────────────────────────────────────────

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

const INPUT  = "w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300 transition-colors";
const SELECT = INPUT;

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

// ── Bank account form ─────────────────────────────────────────────────────────
function BankForm({ initial, onSave, onCancel }: {
  initial?: Partial<BankAccount>;
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
      color: initial?.color ?? BANK_COLOR_MAP[type],
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
function CardForm({ parentId, bank, onSave, onCancel }: {
  parentId: string;
  bank:     string;
  onSave: (d: object) => Promise<void>;
  onCancel: () => void;
}) {
  const [name,        setName]        = useState("");
  const [type,        setType]        = useState<CardType>("debit_card");
  const [lastFour,    setLastFour]    = useState("");
  const [network,     setNetwork]     = useState<CardNetwork>("Visa");
  const [creditLimit, setCreditLimit] = useState("");
  const [saving,      setSaving]      = useState(false);

  const submit = async () => {
    if (!name.trim() || lastFour.length < 4) return;
    if (type === "credit_card" && !creditLimit) return;
    setSaving(true);
    const limit = type === "credit_card" ? Number(creditLimit) : undefined;
    await onSave({
      name: name.trim(), type, lastFour, network, parentId, bank,
      color: type === "credit_card" ? "#f43f5e" : "#10b981",
      ...(limit !== undefined ? { creditLimit: limit, balance: limit } : {}),
    });
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
          <select className={SELECT} value={type} onChange={(e) => setType(e.target.value as CardType)}>
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
      {type === "credit_card" && (
        <Field label="Credit limit (₹)" required>
          <div className="flex items-center gap-1 rounded-xl border border-black/[0.08] bg-white px-3 py-2">
            <span className="text-sm text-slate-400">₹</span>
            <input type="number" className="flex-1 bg-transparent text-sm text-slate-700 outline-none font-mono"
              value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="50000" />
          </div>
        </Field>
      )}
      <FormActions
        onCancel={onCancel} onSave={submit} saving={saving}
        disabled={!name.trim() || lastFour.length < 4 || (type === "credit_card" && !creditLimit)}
      />
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
    await onSave({ name: upiApp, bank, type: "upi", upiId: upiId.trim(), upiApp, parentId, color: "#8b5cf6" });
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
    await onSave({ name: name.trim(), balance: balance ? Number(balance) : 0, color: "#f59e0b" });
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

// ─── Card chip ────────────────────────────────────────────────────────────────
function CardChip({ card, onDelete }: { card: CardItem; onDelete: () => void }) {
  const c = card.color;
  const isCreditCard = card.type === "credit_card";
  const available    = card.balance   ?? 0;
  const limit        = card.creditLimit ?? 0;
  const used         = limit - available;
  const usedPct      = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const overLimit    = available < 0;

  return (
    <div className="relative group flex flex-col gap-1.5 rounded-2xl border p-3 transition-shadow hover:shadow-md"
      style={{ borderColor: c + "44", background: c + "0d" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {typeIcon(card.type, 12, c)}
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c }}>
            {isCreditCard ? "Credit" : "Debit"}
          </span>
        </div>
        <button onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all">
          <Trash2 size={11} />
        </button>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 truncate">{card.name}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {card.network && card.lastFour ? `${card.network} ···· ${card.lastFour}` : card.lastFour ? `···· ${card.lastFour}` : ""}
        </p>
      </div>
      {isCreditCard && limit > 0 && (
        <div className="mt-0.5">
          <div className="h-1 w-full rounded-full bg-black/[0.06] overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", overLimit ? "bg-rose-500" : usedPct > 80 ? "bg-amber-400" : "bg-emerald-400")}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className={cn("text-[9px] font-mono", overLimit ? "text-rose-500 font-semibold" : "text-slate-400")}>
              ₹{used.toLocaleString("en-IN")} used
            </span>
            <span className="text-[9px] text-slate-300 font-mono">₹{limit.toLocaleString("en-IN")} limit</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── UPI chip ─────────────────────────────────────────────────────────────────
function UpiChip({ upi, onDelete }: { upi: UpiAccount; onDelete: () => void }) {
  const c = upi.color;
  return (
    <div className="relative group flex flex-col gap-1.5 rounded-2xl border p-3 transition-shadow hover:shadow-md"
      style={{ borderColor: c + "44", background: c + "0d" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Smartphone size={12} style={{ color: c }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c }}>UPI</span>
        </div>
        <button onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all">
          <Trash2 size={11} />
        </button>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 truncate">{upi.upiId ?? upi.name}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{upi.upiApp}</p>
      </div>
    </div>
  );
}

// ─── Bank accordion ───────────────────────────────────────────────────────────
function BankAccordion({
  bank, cardItems, upiItems, onAddCard, onAddUpi, onDeleteBank, onDeleteCard, onDeleteUpi,
}: {
  bank:          BankAccount;
  cardItems:     CardItem[];
  upiItems:      UpiAccount[];
  onAddCard:     () => void;
  onAddUpi:      () => void;
  onDeleteBank:  () => void;
  onDeleteCard:  (id: string) => void;
  onDeleteUpi:   (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const c = bank.color;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: c + "33" }}>
      <div
        role="button" tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === "Enter" && setOpen((o) => !o)}
        className="flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors hover:bg-black/[0.02] cursor-pointer"
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
            ₹{(bank.balance ?? 0).toLocaleString("en-IN")}
          </span>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-slate-400">{cardItems.length + upiItems.length} linked</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteBank(); }}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all"
          >
            <Trash2 size={12} />
          </button>
          <ChevronDown size={14} className={cn("text-slate-400 transition-transform", open && "rotate-180")} />
        </div>
      </div>

      {open && (
        <div className="px-4 py-4 border-t border-black/[0.05] flex flex-col gap-4">
          {/* Cards */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cards</p>
              <button onClick={onAddCard}
                className="flex items-center gap-1 text-[10px] font-medium text-indigo-500 hover:text-indigo-700 transition-colors">
                <Plus size={10} />Add card
              </button>
            </div>
            {cardItems.length === 0 ? (
              <p className="text-xs text-slate-300 italic">No cards linked yet</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cardItems.map((card) => (
                  <CardChip key={card._id} card={card} onDelete={() => onDeleteCard(card._id)} />
                ))}
              </div>
            )}
          </div>

          {/* UPI */}
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
                  <UpiChip key={upi._id} upi={upi} onDelete={() => onDeleteUpi(upi._id)} />
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
function WalletChip({ wallet, onDelete }: { wallet: WalletItem; onDelete: () => void }) {
  const c = wallet.color;
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
        <p className="text-sm font-semibold text-slate-800">{wallet.name}</p>
        {wallet.balance > 0 && (
          <p className="text-xs font-mono font-semibold mt-0.5" style={{ color: c }}>
            ₹{wallet.balance.toLocaleString("en-IN")}
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
  const [banks,   setBanks]   = useState<BankAccount[]>([]);
  const [upis,    setUpis]    = useState<UpiAccount[]>([]);
  const [cards,   setCards]   = useState<CardItem[]>([]);
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState<AddingState>(null);

  const load = useCallback(async () => {
    const [acctRes, cardRes, walletRes] = await Promise.all([
      fetch("/api/accounts"),
      fetch("/api/cards"),
      fetch("/api/wallets"),
    ]);
    const [accts, cardData, walletData] = await Promise.all([
      acctRes.json(),
      cardRes.json(),
      walletRes.json(),
    ]);
    setBanks(accts.filter((a: BankAccount) => a.type === "savings" || a.type === "current"));
    setUpis(accts.filter((a: UpiAccount) => a.type === "upi"));
    setCards(cardData);
    setWallets(walletData);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    window.addEventListener("owl:transaction:created", load);
    return () => window.removeEventListener("owl:transaction:created", load);
  }, [load]);

  const cardsFor = (bankId: string) => cards.filter((c) => c.parentId === bankId);
  const upisFor  = (bankId: string) => upis.filter((u) => u.parentId === bankId);

  const handleCreateBank = async (data: object) => {
    const res = await post("/api/accounts", data);
    if (!res.ok) { console.error("[accounts] create failed", await res.json().catch(() => ({}))); return; }
    setAdding(null);
    load();
  };

  const handleCreateUpi = async (data: object) => {
    const res = await post("/api/accounts", data);
    if (!res.ok) { console.error("[accounts] upi create failed", await res.json().catch(() => ({}))); return; }
    setAdding(null);
    load();
  };

  const handleCreateCard = async (data: object) => {
    const res = await post("/api/cards", data);
    if (!res.ok) { console.error("[cards] create failed", await res.json().catch(() => ({}))); return; }
    setAdding(null);
    load();
  };

  const handleCreateWallet = async (data: object) => {
    const res = await post("/api/wallets", data);
    if (!res.ok) { console.error("[wallets] create failed", await res.json().catch(() => ({}))); return; }
    setAdding(null);
    load();
  };

  const handleDeleteBank = async (id: string) => {
    await del(`/api/accounts/${id}`);
    load();
  };

  const handleDeleteCard = async (id: string) => {
    await del(`/api/cards/${id}`);
    load();
  };

  const handleDeleteUpi = async (id: string) => {
    await del(`/api/accounts/${id}`);
    load();
  };

  const handleDeleteWallet = async (id: string) => {
    await del(`/api/wallets/${id}`);
    load();
  };

  const totalCards   = cards.length;
  const totalWallets = wallets.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-black/[0.05]">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-slate-800">Accounts & Cards</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {banks.length} bank{banks.length !== 1 ? "s" : ""} · {totalCards} card{totalCards !== 1 ? "s" : ""} · {totalWallets} wallet{totalWallets !== 1 ? "s" : ""}
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
                  <BankForm onSave={handleCreateBank} onCancel={() => setAdding(null)} />
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
                        cardItems={cardsFor(bank._id)}
                        upiItems={upisFor(bank._id)}
                        onAddCard={() => setAdding({ type: "card", parentId: bank._id, bank: bank.bank })}
                        onAddUpi={() => setAdding({ type: "upi", parentId: bank._id, bank: bank.bank })}
                        onDeleteBank={() => handleDeleteBank(bank._id)}
                        onDeleteCard={handleDeleteCard}
                        onDeleteUpi={handleDeleteUpi}
                      />
                      {adding?.type === "card" && adding.parentId === bank._id && (
                        <div className="mt-2">
                          <CardForm parentId={bank._id} bank={adding.bank} onSave={handleCreateCard} onCancel={() => setAdding(null)} />
                        </div>
                      )}
                      {adding?.type === "upi" && adding.parentId === bank._id && (
                        <div className="mt-2">
                          <UpiForm parentId={bank._id} bank={bank.bank} onSave={handleCreateUpi} onCancel={() => setAdding(null)} />
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
                  <WalletForm onSave={handleCreateWallet} onCancel={() => setAdding(null)} />
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
                    <WalletChip key={w._id} wallet={w} onDelete={() => handleDeleteWallet(w._id)} />
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
