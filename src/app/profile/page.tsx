"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Lock, LogOut } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";

interface UserInfo {
  username:    string;
  displayName: string;
}

export default function ProfilePage() {
  const [user,         setUser]         = useState<UserInfo | null>(null);
  const [displayName,  setDisplayName]  = useState("");
  const [currentPwd,   setCurrentPwd]   = useState("");
  const [newPwd,       setNewPwd]       = useState("");
  const [confirmPwd,   setConfirmPwd]   = useState("");
  const [profileMsg,   setProfileMsg]   = useState("");
  const [pwdMsg,       setPwdMsg]       = useState("");
  const [profileError, setProfileError] = useState("");
  const [pwdError,     setPwdError]     = useState("");
  const [saving,       setSaving]       = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: UserInfo) => {
        setUser(d);
        setDisplayName(d.displayName);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const saveProfile = async () => {
    setSaving(true);
    setProfileMsg("");
    setProfileError("");
    const res  = await fetch("/api/auth/me", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ displayName }),
    });
    const data = await res.json() as { error?: string; displayName?: string };
    if (res.ok) {
      setProfileMsg("Saved!");
      setUser((u) => u ? { ...u, displayName: data.displayName! } : u);
    } else {
      setProfileError(data.error ?? "Failed to save");
    }
    setSaving(false);
  };

  const changePassword = async () => {
    setPwdMsg("");
    setPwdError("");
    if (newPwd !== confirmPwd) { setPwdError("Passwords don't match"); return; }
    if (newPwd.length < 6)     { setPwdError("At least 6 characters"); return; }
    setSaving(true);
    const res  = await fetch("/api/auth/me", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
    });
    const data = await res.json() as { error?: string };
    if (res.ok) {
      setPwdMsg("Password updated!");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } else {
      setPwdError(data.error ?? "Failed to update password");
    }
    setSaving(false);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-1" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dot-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/"
          className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-black/[0.05] text-slate-400 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-[18px] font-semibold text-slate-800">Profile</h1>
          <p className="text-xs text-slate-400">@{user.username}</p>
        </div>
      </div>

      <div className="flex flex-col gap-5">

        {/* Display name */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={14} className="text-blue-400" />
            <p className="text-sm font-semibold text-slate-700">Display name</p>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Name
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300 transition-colors"
              />
            </div>
            {profileError && <p className="text-xs text-rose-500">{profileError}</p>}
            {profileMsg   && <p className="text-xs text-green-600">{profileMsg}</p>}
            <button
              onClick={saveProfile}
              disabled={saving || !displayName.trim()}
              className="self-end rounded-xl bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>

        {/* Change password */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={14} className="text-blue-400" />
            <p className="text-sm font-semibold text-slate-700">Change password</p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { label: "Current password",  value: currentPwd, set: setCurrentPwd },
              { label: "New password",      value: newPwd,     set: setNewPwd },
              { label: "Confirm password",  value: confirmPwd, set: setConfirmPwd },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  {label}
                </label>
                <input
                  type="password"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300 transition-colors placeholder-slate-300"
                />
              </div>
            ))}
            {pwdError && <p className="text-xs text-rose-500">{pwdError}</p>}
            {pwdMsg   && <p className="text-xs text-green-600">{pwdMsg}</p>}
            <button
              onClick={changePassword}
              disabled={saving || !currentPwd || !newPwd || !confirmPwd}
              className="self-end rounded-xl bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Update password
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className={cn(
            "flex items-center justify-center gap-2 rounded-2xl px-5 py-3",
            "glass-card text-rose-500 hover:bg-rose-50 transition-all text-sm font-medium"
          )}
        >
          <LogOut size={14} />
          Log out
        </button>

      </div>
    </div>
  );
}
