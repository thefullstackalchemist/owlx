"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Target, CheckCircle2, AlertCircle, Trash2, Pencil, X, Check, Landmark } from "lucide-react";
import { cn } from "@/utils/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Account {
  _id:      string;
  name:     string;
  bank:     string;
  type:     string;
  balance?: number;
  color:    string;
}

interface Bucket {
  _id:         string;
  name:        string;
  description?: string;
  target:      number;
  accountId:   Account;   // populated
  color:       string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTE = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b",
  "#f43f5e", "#8b5cf6", "#ec4899", "#14b8a6",
];

// ─── Bucket card ──────────────────────────────────────────────────────────────

function BucketCard({ bucket, onEdit, onDelete }: {
  bucket:   Bucket;
  onEdit:   () => void;
  onDelete: () => void;
}) {
  const balance   = bucket.accountId?.balance ?? 0;
  const target    = bucket.target;
  const pct       = Math.min((balance / target) * 100, 100);
  const complete  = balance >= target;
  const deficit   = !complete;
  const c         = bucket.color;

  return (
    <div className={cn(
      "relative flex flex-col gap-4 rounded-2xl border-2 p-5 transition-all hover:shadow-md",
      complete ? "border-emerald-300 bg-emerald-50/40" : deficit && balance < target * 0.5
        ? "border-rose-300 bg-rose-50/30"
        : "border-amber-200 bg-amber-50/20"
    )}>
      {/* Status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {complete
            ? <CheckCircle2 size={14} className="text-emerald-500" />
            : <AlertCircle  size={14} className="text-rose-400" />
          }
          <span className={cn(
            "text-[10px] font-semibold uppercase tracking-wider",
            complete ? "text-emerald-600" : "text-rose-500"
          )}>
            {complete ? "Goal reached!" : `₹${(target - balance).toLocaleString("en-IN")} to go`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit}   className="p-1.5 rounded-lg hover:bg-black/[0.06] text-slate-400 transition-colors"><Pencil  size={11} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-400 transition-colors"><Trash2 size={11} /></button>
        </div>
      </div>

      {/* Name + desc */}
      <div>
        <p className="text-base font-bold text-slate-800">{bucket.name}</p>
        {bucket.description && <p className="text-xs text-slate-500 mt-0.5">{bucket.description}</p>}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-mono font-semibold text-slate-700">
            ₹{balance.toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-slate-400">
            of ₹{target.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              complete ? "bg-emerald-400" : balance < target * 0.5 ? "bg-rose-400" : "bg-amber-400"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1 text-right">{Math.round(pct)}% funded</p>
      </div>

      {/* Linked account */}
      <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white/60 px-3 py-2">
        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: c + "22" }}>
          <Landmark size={11} style={{ color: c }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-700 truncate">{bucket.accountId?.name ?? "—"}</p>
          <p className="text-[10px] text-slate-400">{bucket.accountId?.bank}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Bucket form ──────────────────────────────────────────────────────────────

function BucketForm({ accounts, initial, onSave, onCancel }: {
  accounts: Account[];
  initial?: Partial<{ name: string; description: string; target: number; accountId: string; color: string }>;
  onSave:   (d: object) => Promise<void>;
  onCancel: () => void;
}) {
  const [name,      setName]      = useState(initial?.name        ?? "");
  const [desc,      setDesc]      = useState(initial?.description  ?? "");
  const [target,    setTarget]    = useState(initial?.target?.toString() ?? "");
  const [accountId, setAccountId] = useState(initial?.accountId   ?? "");
  const [color,     setColor]     = useState(initial?.color        ?? PALETTE[0]);
  const [saving,    setSaving]    = useState(false);

  // Only bank accounts (savings/current) make sense as bucket sources
  const bankAccounts = accounts.filter((a) => a.type === "savings" || a.type === "current");

  const submit = async () => {
    if (!name.trim() || !target || !accountId) return;
    setSaving(true);
    await onSave({ name: name.trim(), description: desc.trim() || undefined,
      target: Number(target), accountId, color });
    setSaving(false);
  };

  const INPUT = "w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-300 transition-colors";

  return (
    <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/30 p-5 flex flex-col gap-4">
      <p className="text-sm font-semibold text-slate-700">{initial ? "Edit Bucket" : "New Savings Bucket"}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Name *</label>
          <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency Fund" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Target (₹) *</label>
          <div className="flex items-center gap-1 rounded-xl border border-black/[0.08] bg-white px-3 py-2.5">
            <span className="text-sm text-slate-400">₹</span>
            <input type="number" className="flex-1 bg-transparent text-sm text-slate-700 outline-none font-mono"
              value={target} onChange={(e) => setTarget(e.target.value)} placeholder="100000" />
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Description</label>
        <input className={INPUT} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What's this for?" />
      </div>

      <div>
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Linked account *</label>
        {bankAccounts.length === 0 ? (
          <p className="text-xs text-amber-600 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            No bank accounts found — add a savings or current account first.
          </p>
        ) : (
          <select className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-300 transition-colors"
            value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Select account…</option>
            {bankAccounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} · {a.bank}{a.balance !== undefined ? ` (₹${a.balance.toLocaleString("en-IN")})` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Colour picker */}
      <div>
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Colour</label>
        <div className="flex gap-2 flex-wrap">
          {PALETTE.map((p) => (
            <button key={p} onClick={() => setColor(p)}
              className={cn("w-6 h-6 rounded-full border-2 transition-all", color === p ? "border-slate-600 scale-110" : "border-transparent")}
              style={{ backgroundColor: p }} />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-sm text-slate-500 hover:bg-black/[0.04] transition-colors">
          <X size={12} className="inline mr-1" />Cancel
        </button>
        <button onClick={submit} disabled={saving || !name.trim() || !target || !accountId}
          className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
          <Check size={12} className="inline mr-1" />{saving ? "Saving…" : "Save Bucket"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SavingsPage() {
  const [buckets,    setBuckets]    = useState<Bucket[]>([]);
  const [accounts,   setAccounts]   = useState<Account[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<Bucket | null>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/savings").then((r)  => r.json()),
      fetch("/api/accounts").then((r) => r.json()),
    ]).then(([b, a]: [Bucket[], Account[]]) => {
      setBuckets(b);
      setAccounts(a);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Re-fetch when a transaction is created so balances update
  useEffect(() => {
    const refresh = () => load();
    window.addEventListener("owl:transaction:created", refresh);
    return () => window.removeEventListener("owl:transaction:created", refresh);
  }, [load]);

  const handleCreate = async (data: object) => {
    await fetch("/api/savings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowForm(false);
    load();
  };

  const handleEdit = async (data: object) => {
    if (!editTarget) return;
    await fetch(`/api/savings/${editTarget._id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditTarget(null);
    load();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/savings/${id}`, { method: "DELETE" });
    load();
  };

  const complete = buckets.filter((b) => (b.accountId?.balance ?? 0) >= b.target).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-black/[0.05]">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-slate-800">Savings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {buckets.length} bucket{buckets.length !== 1 ? "s" : ""} · {complete} complete
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditTarget(null); }}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus size={13} strokeWidth={2.5} />
          New Bucket
        </button>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-1" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-2" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-3" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {showForm && !editTarget && (
              <BucketForm accounts={accounts} onSave={handleCreate} onCancel={() => setShowForm(false)} />
            )}

            {buckets.length === 0 && !showForm ? (
              <div className="flex flex-col items-center justify-center h-56 glass-card rounded-2xl text-center gap-2">
                <Target size={32} className="text-slate-200" />
                <p className="text-sm font-medium text-slate-600">No savings buckets yet</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Create buckets for goals like Emergency Fund, New Laptop, or Vacation.
                  Link each bucket to a bank account — balance updates automatically with every transaction.
                </p>
              </div>
            ) : (
              <>
                {/* Summary strip */}
                {buckets.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total buckets",  value: buckets.length.toString() },
                      { label: "Goals complete", value: complete.toString(), color: "text-emerald-600" },
                      { label: "In progress",    value: (buckets.length - complete).toString(), color: "text-amber-500" },
                    ].map((s) => (
                      <div key={s.label} className="glass-card rounded-xl px-4 py-3">
                        <p className={cn("text-xl font-bold", s.color ?? "text-slate-800")}>{s.value}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buckets.map((bucket) => (
                    editTarget?._id === bucket._id ? (
                      <div key={bucket._id} className="sm:col-span-2 lg:col-span-3">
                        <BucketForm
                          accounts={accounts}
                          initial={{
                            name: bucket.name, description: bucket.description,
                            target: bucket.target, accountId: bucket.accountId?._id, color: bucket.color,
                          }}
                          onSave={handleEdit}
                          onCancel={() => setEditTarget(null)}
                        />
                      </div>
                    ) : (
                      <BucketCard
                        key={bucket._id}
                        bucket={bucket}
                        onEdit={() => { setEditTarget(bucket); setShowForm(false); }}
                        onDelete={() => handleDelete(bucket._id)}
                      />
                    )
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
