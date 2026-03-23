"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { TRANSACTION_CATEGORIES, CATEGORY_META } from "@/constants";
import type { NewTransactionData } from "@/services/chatService";

interface Props {
  initialData?: Partial<NewTransactionData>;
  onClose: () => void;
  onSave: (data: NewTransactionData) => Promise<void>;
}

const today = new Date().toISOString().split("T")[0];

export default function NewTransactionModal({ initialData, onClose, onSave }: Props) {
  const [amount,      setAmount]      = useState(initialData?.amount?.toString() ?? "");
  const [type,        setType]        = useState<"income" | "expense" | "transfer">(initialData?.type ?? "expense");
  const [category,    setCategory]    = useState(initialData?.category ?? "Food & Dining");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [date,        setDate]        = useState(initialData?.date ?? today);
  const [platform,    setPlatform]    = useState(initialData?.platform ?? "");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  // Update type when category changes (use defaultType)
  useEffect(() => {
    const meta = CATEGORY_META[category];
    if (meta && !initialData?.type) setType(meta.defaultType);
  }, [category, initialData?.type]);

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
      await onSave({
        amount:      Number(amount),
        type,
        category,
        description: description.trim(),
        date,
        platform:    platform.trim() || undefined,
      });
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-[420px] glass-strong rounded-3xl p-6 shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-800">New Transaction</h2>
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

          {/* Type toggle */}
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
                      ? t === "income"
                        ? "bg-green-500 text-white shadow-sm"
                        : t === "expense"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "bg-slate-600 text-white shadow-sm"
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
              placeholder="e.g. Lunch at Haldirams"
              className="w-full rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300 transition-colors placeholder-slate-300"
            />
          </div>

          {/* Date + Platform row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Platform <span className="normal-case text-slate-300">(optional)</span>
              </label>
              <input
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="e.g. Swiggy"
                className="w-full rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300 transition-colors placeholder-slate-300"
              />
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-xs text-rose-500">{error}</p>}

          {/* Actions */}
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
              className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Transaction"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
