"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, BarChart3, Settings, UserCircle, LogOut, Landmark, PiggyBank } from "lucide-react";
import { cn } from "@/utils/cn";

const nav = [
  { label: "Dashboard",    href: "/",             icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions",  icon: ArrowLeftRight  },
  { label: "Accounts",     href: "/accounts",      icon: Landmark        },
  { label: "Savings",      href: "/savings",       icon: PiggyBank       },
  { label: "Analysis",     href: "/analysis",      icon: BarChart3       },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="glass flex h-full w-[220px] shrink-0 flex-col border-r border-black/[0.06]">
      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🦉</span>
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] text-blue-500 uppercase">OWL</p>
            <p className="text-[9px] text-slate-400 leading-tight tracking-wide">Wealth Ledger</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1 pt-2">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
                active
                  ? "bg-blue-50 text-blue-600 font-medium shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-black/[0.04]"
              )}
            >
              <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 flex flex-col gap-0.5">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
            pathname === "/profile"
              ? "bg-blue-50 text-blue-600 font-medium"
              : "text-slate-500 hover:text-slate-800 hover:bg-black/[0.04]"
          )}
        >
          <UserCircle size={15} strokeWidth={1.8} />
          Profile
        </Link>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
            pathname === "/settings"
              ? "bg-blue-50 text-blue-600 font-medium"
              : "text-slate-400 hover:text-slate-700 hover:bg-black/[0.04]"
          )}
        >
          <Settings size={15} strokeWidth={1.8} />
          Settings
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-150"
        >
          <LogOut size={15} strokeWidth={1.8} />
          Logout
        </button>
      </div>
    </aside>
  );
}
