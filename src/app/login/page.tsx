"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import Image from "next/image";

type Mode = "login" | "setup";

export default function LoginPage() {
  const [mode,        setMode]     = useState<Mode>("login");
  const [username,    setUsername] = useState("");
  const [displayName, setDisplay]  = useState("");
  const [password,    setPassword] = useState("");
  const [showPwd,     setShowPwd]  = useState(false);
  const [error,       setError]    = useState("");
  const [loading,     setLoading]  = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((d: { hasUsers: boolean }) => { if (!d.hasUsers) setMode("setup"); })
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (!username.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      const body: Record<string, string> = { username: username.trim(), password };
      if (mode === "setup" && displayName) body.displayName = displayName.trim();
      const res  = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/setup",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      const data = await res.json() as { error?: string };
      if (res.ok) { router.push("/"); router.refresh(); }
      else setError(data.error ?? "Something went wrong");
    } catch { setError("Network error — try again"); }
    finally { setLoading(false); }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") submit(); };

  return (
    <div
      className="min-h-full flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "#6366f1" }}
    >

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[400px] animate-fade-in-up"
        style={{
          background:           "rgba(255, 255, 255, 0.08)",
          backdropFilter:       "blur(48px) saturate(180%)",
          WebkitBackdropFilter: "blur(48px) saturate(180%)",
          border:               "1px solid rgba(255, 255, 255, 0.18)",
          borderRadius:         "28px",
          boxShadow: [
            "inset 0 1px 0 rgba(255,255,255,0.15)",
            "0 32px 64px rgba(0,0,0,0.30)",
            "0 0 0 1px rgba(0,0,0,0.08)",
          ].join(", "),
          padding: "44px 40px",
          color: "#ffffff",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div
            className="flex items-center justify-center w-[72px] h-[72px]"
            style={{
              background:   "linear-gradient(145deg, rgba(139,92,246,0.35), rgba(167,139,250,0.20))",
              border:       "1px solid rgba(255,255,255,0.25)",
              borderRadius: "22px",
              boxShadow:    "0 0 32px rgba(139,92,246,0.30), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <Image src="/fauget.png" alt="Fauget logo" width={52} height={52} className="rounded-2xl" />
          </div>

          <div className="text-center">
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.35em", color: "rgba(255,255,255,0.95)", textTransform: "uppercase", lineHeight: 1, marginBottom: 6 }}>
              OWL
            </p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Outstanding Wealth Ledger
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mb-7"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)" }} />

        <p style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.95)", marginBottom: 24, letterSpacing: "-0.01em" }}>
          {mode === "login" ? "Welcome back" : "Let\u2019s get you set up"}
        </p>

        <div className="flex flex-col gap-4">

          {/* Display name — setup only */}
          {mode === "setup" && (
            <div className="animate-fade-in-up">
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", marginBottom: 8 }}>
                Display name <span style={{ textTransform: "none", opacity: 0.6 }}>(optional)</span>
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplay(e.target.value)}
                onKeyDown={onKey}
                placeholder="e.g. Anu"
                className="input-dark w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>
          )}

          {/* Username */}
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", marginBottom: 8 }}>
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={onKey}
              placeholder="your username"
              autoFocus
              className="input-dark w-full rounded-xl px-4 py-3 text-sm"
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", marginBottom: 8 }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKey}
                placeholder="••••••••"
                className="input-dark w-full rounded-xl px-4 py-3 pr-11 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.50)", background: "none", border: "none", cursor: "pointer" }}
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                borderRadius: 12,
                padding: "10px 16px",
                fontSize: 12,
                color: "rgba(252,165,165,1)",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.30)",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={loading || !username.trim() || !password}
            className="w-full rounded-xl py-3 flex items-center justify-center gap-2 mt-1 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#ffffff",
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
              boxShadow: "0 0 28px rgba(139,92,246,0.50), 0 4px 16px rgba(0,0,0,0.25)",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 40px rgba(167,139,250,0.65), 0 4px 20px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 28px rgba(139,92,246,0.50), 0 4px 16px rgba(0,0,0,0.25)";
            }}
          >
            {loading ? (
              <span className="flex gap-1">
                <span className="w-1 h-1 rounded-full bg-white/60 dot-1" />
                <span className="w-1 h-1 rounded-full bg-white/60 dot-2" />
                <span className="w-1 h-1 rounded-full bg-white/60 dot-3" />
              </span>
            ) : (
              <>
                {mode === "login" ? "Login" : "Create Account"}
                <ArrowRight size={14} />
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}
