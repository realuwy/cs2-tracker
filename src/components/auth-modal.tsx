"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "signup" | "reset";

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        setMsg("Logged in!");
        onClose(); // close on success
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        setMsg("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset`,
        });
        if (error) throw error;
        setMsg("Password reset link sent. Check your inbox.");
      }
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const Title = mode === "login" ? "Log In" : mode === "signup" ? "Create account" : "Reset password";
  const Primary = mode === "login" ? "Log In" : mode === "signup" ? "Sign Up" : "Send reset link";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-950/95 shadow-[0_0_0_1px_rgba(0,0,0,0.6),0_20px_70px_-30px_rgba(0,0,0,0.7)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-100">{Title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-5">
          {/* Subtitle */}
          <p className="mb-4 text-sm text-slate-400">
            {mode === "login" && "Welcome back."}
            {mode === "signup" && "Let’s get you set up."}
            {mode === "reset" && "We’ll email you a reset link."}
          </p>

          {/* Alerts */}
          {err && (
            <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {err}
            </div>
          )}
          {msg && (
            <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-100 placeholder:text-slate-500
                           shadow-inner shadow-black/40 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/25"
                placeholder="you@email.com"
              />
            </div>

            {/* Password (hide for reset mode) */}
            {mode !== "reset" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Password</label>
                <input
                  type="password"
                  required={mode !== "reset"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-100 placeholder:text-slate-500
                             shadow-inner shadow-black/40 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/25"
                  placeholder="••••••••"
                />
              </div>
            )}

            {/* Forgot link */}
            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setErr(null);
                    setMsg(null);
                    setMode("reset");
                  }}
                  className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Primary action */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-indigo-500 px-4 py-2.5 font-semibold text-white shadow-[0_8px_30px_-12px_rgba(99,102,241,.5)]
                         transition hover:bg-indigo-400 disabled:opacity-60"
            >
              {loading ? "Please wait…" : Primary}
            </button>
          </form>

          {/* Switch mode */}
          <div className="mt-4 text-center text-sm text-slate-400">
            {mode === "login" ? (
              <>
                Don’t have an account?{" "}
                <button
                  className="font-medium text-indigo-300 hover:text-indigo-200"
                  onClick={() => {
                    setErr(null);
                    setMsg(null);
                    setMode("signup");
                  }}
                >
                  Sign Up
                </button>
              </>
            ) : mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  className="font-medium text-indigo-300 hover:text-indigo-200"
                  onClick={() => {
                    setErr(null);
                    setMsg(null);
                    setMode("login");
                  }}
                >
                  Log In
                </button>
              </>
            ) : (
              <>
                Remembered it?{" "}
                <button
                  className="font-medium text-indigo-300 hover:text-indigo-200"
                  onClick={() => {
                    setErr(null);
                    setMsg(null);
                    setMode("login");
                  }}
                >
                  Back to Log In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

