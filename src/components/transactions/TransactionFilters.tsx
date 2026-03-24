"use client";

import { useState, useEffect } from "react";
import { CalendarDays, ChevronDown, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { TRANSACTION_CATEGORIES, CATEGORY_META } from "@/constants";

interface Account { _id: string; name: string; bank: string; color: string; }

export interface FilterState {
  mode:      "preset" | "custom";
  preset:    string;           // e.g. "this_month"
  dateFrom:  string;           // ISO date YYYY-MM-DD
  dateTo:    string;
  type:      string;
  category:  string;
  accountId: string;
}

interface Props {
  value:    FilterState;
  onChange: (f: FilterState) => void;
}

const PRESETS = [
  { value: "today",       label: "Today"      },
  { value: "this_week",   label: "This week"  },
  { value: "this_month",  label: "This month" },
  { value: "last_month",  label: "Last month" },
  { value: "this_year",   label: "This year"  },
  { value: "all",         label: "All time"   },
];

export function defaultFilters(): FilterState {
  return { mode: "preset", preset: "this_month", dateFrom: "", dateTo: "", type: "", category: "", accountId: "" };
}

export default function TransactionFilters({ value, onChange }: Props) {
  const [showCustom, setShowCustom] = useState(value.mode === "custom");
  const [accounts,   setAccounts]   = useState<Account[]>([]);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d: Account[]) => setAccounts(d))
      .catch(() => {});
  }, []);

  const setPreset = (preset: string) => {
    setShowCustom(false);
    onChange({ ...value, mode: "preset", preset, dateFrom: "", dateTo: "" });
  };

  const openCustom = () => {
    setShowCustom(true);
    onChange({ ...value, mode: "custom", preset: "" });
  };

  const setCustomDate = (field: "dateFrom" | "dateTo", v: string) => {
    onChange({ ...value, mode: "custom", preset: "", [field]: v });
  };

  const clearCustom = () => {
    setShowCustom(false);
    onChange({ ...value, mode: "preset", preset: "this_month", dateFrom: "", dateTo: "" });
  };

  const hasActiveCustom = value.mode === "custom" && (value.dateFrom || value.dateTo);

  return (
    <div className="flex flex-col gap-2.5 px-8 py-3 border-b border-black/[0.04]">
      {/* Row 1: preset chips + custom button */}
      <div className="flex items-center gap-2 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              value.mode === "preset" && value.preset === p.value
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-white/70 border border-black/[0.07] text-slate-500 hover:border-blue-200 hover:text-blue-500"
            )}
          >
            {p.label}
          </button>
        ))}

        <button
          onClick={openCustom}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            showCustom
              ? "bg-indigo-50 border border-indigo-200 text-indigo-600"
              : "bg-white/70 border border-black/[0.07] text-slate-500 hover:border-indigo-200 hover:text-indigo-500"
          )}
        >
          <CalendarDays size={12} />
          Custom range
          <ChevronDown size={11} className={cn("transition-transform", showCustom && "rotate-180")} />
        </button>

        {hasActiveCustom && (
          <button
            onClick={clearCustom}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent transition-all"
          >
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {/* Row 2: custom date inputs (shown when custom is open) */}
      {showCustom && (
        <div className="flex items-center gap-3 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 shrink-0">From</span>
            <input
              type="date"
              value={value.dateFrom}
              onChange={(e) => setCustomDate("dateFrom", e.target.value)}
              className="rounded-lg border border-black/[0.08] bg-white/80 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-300 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 shrink-0">To</span>
            <input
              type="date"
              value={value.dateTo}
              min={value.dateFrom || undefined}
              onChange={(e) => setCustomDate("dateTo", e.target.value)}
              className="rounded-lg border border-black/[0.08] bg-white/80 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-300 transition-colors"
            />
          </div>
          {(value.dateFrom || value.dateTo) && (
            <span className="text-[11px] text-indigo-500 font-medium">
              {value.dateFrom && value.dateTo
                ? `${new Date(value.dateFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(value.dateTo).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                : value.dateFrom
                ? `From ${new Date(value.dateFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                : `Until ${new Date(value.dateTo).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
              }
            </span>
          )}
        </div>
      )}

      {/* Row 3: type + category + account */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={value.category}
          onChange={(e) => onChange({ ...value, category: e.target.value })}
          className="rounded-lg border border-black/[0.08] bg-white/80 px-3 py-1.5 text-xs text-slate-600 outline-none focus:border-blue-300 transition-colors"
        >
          <option value="">All categories</option>
          {TRANSACTION_CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_META[c]?.emoji} {c}</option>
          ))}
        </select>

        <div className="flex rounded-lg border border-black/[0.08] bg-white/70 overflow-hidden">
          {["", "income", "expense", "transfer"].map((t) => (
            <button
              key={t}
              onClick={() => onChange({ ...value, type: t })}
              className={cn(
                "px-3 py-1.5 text-xs font-medium capitalize transition-all",
                value.type === t
                  ? t === "income"   ? "bg-green-500 text-white"
                  : t === "expense"  ? "bg-rose-500 text-white"
                  : t === "transfer" ? "bg-slate-600 text-white"
                  :                   "bg-blue-500 text-white"
                  : "text-slate-500 hover:bg-black/[0.04]"
              )}
            >
              {t === "" ? "All" : t}
            </button>
          ))}
        </div>

        {accounts.length > 0 && (
          <select
            value={value.accountId}
            onChange={(e) => onChange({ ...value, accountId: e.target.value })}
            className="rounded-lg border border-black/[0.08] bg-white/80 px-3 py-1.5 text-xs text-slate-600 outline-none focus:border-blue-300 transition-colors"
          >
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>{a.name} · {a.bank}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
