"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Mode = "login" | "signup" | "reset";

export default function AuthModal({
  onClose,
  initialMode = "login",
}: {
  onClose?: () => void;
  initialMode?: Mode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);

  // shared fields
  const [identifier, setIdentifier] = useState(""); // email OR username (login/reset)
  const [email, setEmail] = useState(""); // email (signup/reset explicit)
  const [username, setUsername] = useState(""); // username (signup)
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    setOk(null);
  }, [mode]);

  const title = useMemo(() => {
    if (mode === "login") return "Log In";
    if (mode === "signup") return "Create account";
    return "Reset password";
  }, [mode]);

  const switchTo = (m: Mode) => {
    setMode(m);
    setErr(null);
    setOk(null);
  };

  /* -------------------------- helper: username → email -------------------------- */
  async function resolveEmailFromUsername(maybeUsername: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", maybeUsername)
      .single();
    if (error || !data?.email) throw new Error("Username not found.");
    return data.email as string;
  }

  /* --------------------------------- handlers --------------------------------- */

  // close then push to dashboard on the next tick (prevents unmount race)
  const continueAsGuest = () => {
    try {
      onClose?.();
    } catch {}
    setTimeout(() => router.push("/dashboard"), 0);
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      // figure out if identifier is email or username
      let loginEmail = identifier.trim();
      if (!loginEmail.includes("@")) {
        loginEmail = await resolveEmailFromUsername(loginEmail);
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: pass,
      });
      if (error) throw error;

      onClose?.();
      router.refresh();
      setTimeout(() => router.push("/dashboard"), 0);
    } catch (e: any) {
      setErr(e?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const cleanEmail = email.trim();
      const cleanUser = username.trim();

      if (!/^[a-z0-9_\.]{3,20}$/i.test(cleanUser)) {
        throw new Error(
          "Username must be 3–20 characters (letters, numbers, underscore, dot)."
        );
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
          data: { username: cleanUser }, // store in auth user metadata as well
        },
      });
      if (error) throw error;

      // also store username/email in profiles table
      // if RLS requires auth, this will work for newly created session;
      // otherwise you may do it after email confirmation.
      const userId = data.user?.id;
      if (userId) {
        await supabase
          .from("profiles")
          .upsert({ user_id: userId, username: cleanUser, email: cleanEmail });
      }

      setOk(
        "Check your inbox to confirm your email. You can log in once confirmed."
      );
    } catch (e: any) {
      setErr(e?.message || "Sign up failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const clean = (identifier || email).trim();
      const targetEmail = clean.includes("@")
        ? clean
        : await resolveEmailFromUsername(clean);

      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/reset`
            : undefined,
      });
      if (error) throw error;
      setOk("Password reset email sent.");
    } catch (e: any) {
      setErr(e?.message || "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  }

  /* ---------------------------------- UI ---------------------------------- */

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0b0d12]/95 shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button
            onClick={() => onClose?.()}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 pt-4 pb-6">
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-slate-300">Welcome back.</p>

              <div>
                <label className="mb-1 block text-sm text-slate-400">
                  Email (or Username)
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@email.com / yourname"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-400">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
                <div className="mt-1 text-right">
                  <button
                    type="button"
                    onClick={() => switchTo("reset")}
                    className="text-xs text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {err && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {err}
                </div>
              )}
              {ok && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  {ok}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {busy ? "Logging in…" : "Log In"}
              </button>

              <button
                type="button"
                onClick={continueAsGuest}
                className="w-full rounded-xl bg-slate-800/70 px-4 py-3 text-slate-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                Continue as guest
              </button>

              <p className="pt-1 text-center text-sm text-slate-400">
                Don’t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchTo("signup")}
                  className="font-medium text-violet-300 hover:text-violet-200"
                >
                  Sign Up
                </button>
              </p>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <p className="text-slate-300">Let’s get you set up.</p>

              <div>
                <label className="mb-1 block text-sm text-slate-400">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-400">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourname"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-400">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              {err && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {err}
                </div>
              )}
              {ok && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  {ok}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {busy ? "Creating…" : "Sign Up"}
              </button>

              <p className="pt-1 text-center text-sm text-slate-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchTo("login")}
                  className="font-medium text-violet-300 hover:text-violet-200"
                >
                  Log In
                </button>
              </p>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-slate-300">
                Enter your email (or username) and we’ll send a reset link.
              </p>
              <div>
                <label className="mb-1 block text-sm text-slate-400">
                  Email or Username
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@email.com / yourname"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              {err && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {err}
                </div>
              )}
              {ok && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  {ok}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {busy ? "Sending…" : "Send reset link"}
              </button>

              <p className="pt-1 text-center text-sm text-slate-400">
                <button
                  type="button"
                  onClick={() => switchTo("login")}
                  className="font-medium text-violet-300 hover:text-violet-200"
                >
                  Back to Log In
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
