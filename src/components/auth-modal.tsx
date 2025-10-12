"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type View = "login" | "signup" | "forgot";

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const clearNotices = () => {
    setMsg(null);
    setErr(null);
  };

  async function handleLogin() {
    clearNotices();
    if (!email || !password) return setErr("Please enter your email and password.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setMsg("Logged in. Redirecting…");
      // Close and refresh to pull user + rows
      setTimeout(() => {
        onClose();
        location.reload();
      }, 400);
    } catch (e: any) {
      setErr(e?.message || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup() {
    clearNotices();
    if (!email || !password) return setErr("Please enter your email and a password (min 6 chars).");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Make sure this matches your deployed URL in Supabase settings
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
      setMsg("Check your email to confirm your account.");
    } catch (e: any) {
      setErr(e?.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot() {
    clearNotices();
    if (!email) return setErr("Enter your account email first.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (error) throw error;
      setMsg("Password reset email sent. Please check your inbox.");
    } catch (e: any) {
      setErr(e?.message || "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-5 text-white shadow-xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-semibold">
            {view === "login" && "Log In"}
            {view === "signup" && "Sign Up"}
            {view === "forgot" && "Reset Password"}
          </h2>
          {view !== "forgot" && (
            <p className="mt-1 text-sm text-white/60">
              {view === "login" ? "Welcome back." : "Create your account."}
            </p>
          )}
        </div>

        {/* Notices */}
        {err && <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-300">{err}</div>}
        {msg && <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-sm text-emerald-300">{msg}</div>}

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-white/60">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {view !== "forgot" && (
            <div>
              <label className="mb-1 block text-xs text-white/60">Password</label>
              <input
                type="password"
                className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={view === "login" ? "current-password" : "new-password"}
              />
            </div>
          )}

          {/* Forgot link */}
          {view === "login" && (
            <div className="text-right">
              <button
                className="text-xs text-amber-400 hover:underline"
                onClick={() => {
                  clearNotices();
                  setView("forgot");
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            {view === "login" && (
              <button
                className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-60"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Logging in…" : "Log In"}
              </button>
            )}

            {view === "signup" && (
              <button
                className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-60"
                onClick={handleSignup}
                disabled={loading}
              >
                {loading ? "Creating account…" : "Sign Up"}
              </button>
            )}

            {view === "forgot" && (
              <button
                className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-60"
                onClick={handleForgot}
                disabled={loading}
              >
                {loading ? "Sending email…" : "Send reset link"}
              </button>
            )}
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-4 text-center text-xs text-white/70">
          {view === "login" && (
            <>
              Don&apos;t have an account?{" "}
              <button
                className="font-medium text-amber-400 hover:underline"
                onClick={() => {
                  clearNotices();
                  setView("signup");
                }}
              >
                Sign Up
              </button>
            </>
          )}
          {view === "signup" && (
            <>
              Already have an account?{" "}
              <button
                className="font-medium text-amber-400 hover:underline"
                onClick={() => {
                  clearNotices();
                  setView("login");
                }}
              >
                Log In
              </button>
            </>
          )}
          {view === "forgot" && (
            <>
              Remembered your password?{" "}
              <button
                className="font-medium text-amber-400 hover:underline"
                onClick={() => {
                  clearNotices();
                  setView("login");
                }}
              >
                Back to Log In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

