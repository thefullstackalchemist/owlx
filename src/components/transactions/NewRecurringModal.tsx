"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { TRANSACTION_CATEGORIES, CATEGORY_META } from "@/constants";
import type { Frequency } from "@/models/RecurringTransaction";

interface Props {
  onClose: () => void;
  onSave:  () => void;
}

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "daily",   label: "Daily"   },
  { value: "weekly",  label: "Weekly"  },
  { value: "monthly", label: "Monthly" },
  { value: "yearly",  label: "Yearly"  },
];

const today = new Date().toISOString().split("T")[0];

export default function NewRecurringModal({ onClose, onSave }: Props) {
  const [amount,      setAmount]      = useState("");
  const [type,        setType]        = useState<"income" | "expense" | "transfer">("expense");
  const [category,    setCategory]    = useState("Food & Dining");
  const [description, setDescription] = useState("");
  const [platform,    setPlatform]    = useState("");
  const [frequency,   setFrequency]   = useState<Frequency>("monthly");
  const [nextDue,     setNextDue]     = useState(today);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    const meta = CATEGORY_META[category];
    if (meta) setType(meta.defaultType);
  }, [category]);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/recurring", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          amount:      Number(amount),
          type,
          category,
          description: description.trim(),
          platform:    platform.trim() || undefined,
          frequency,
          nextDue,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      onSave();
      onClose();
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[440px] glass-strong rounded-3xl p-6 shadow-2xl animate-fade-in-up">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-800">New Recurring</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Auto-tracked repeating expense or income</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-black/[0.06] text-slate-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Amount */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Amount
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2.5 focus-within:border-blue-300 transition-colors">
              <span className="text-sm font-medium text-slate-400">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent text-lg font-semibold text-slate-800 outline-none tabular"
                autoFocus
              />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Type
            </label>
            <div className="flex rounded-xl border border-black/[0.08] bg-white/60 overflow-hidden">
              {(["expense", "income", "transfer"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium capitalize transition-all",
                    type === t
                      ? t === "income"   ? "bg-green-500 text-white shadow-sm"
                      : t === "expense"  ? "bg-rose-500 text-white shadow-sm"
                      :                   "bg-slate-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-black/[0.04]"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300 transition-colors"
            >
              {TRANSACTION_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_META[cat]?.emoji} {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Netflix subscription"
              className="w-full rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300 transition-colors placeholder-slate-300"
            />
          </div>

          {/* Frequency + First Due */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="w-full rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300 transition-colors"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                First Due
              </label>
              <input
                type="date"
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
                className="w-full rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300 transition-colors"
              />
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Platform <span className="normal-case text-slate-300">(optional)</span>
            </label>
            <input
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="e.g. Netflix, Spotify"
              className="w-full rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300 transition-colors placeholder-slate-300"
            />
          </div>

          {error && <p className="text-xs text-rose-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-sm text-slate-500 hover:bg-black/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-violet-500 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-600 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Recurring"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
