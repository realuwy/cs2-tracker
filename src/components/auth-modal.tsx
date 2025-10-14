"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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
const supabase = getSupabaseClient();
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

  /* helper: username → email */
  async function resolveEmailFromUsername(maybeUsername: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", maybeUsername)
      .single();
    if (error || !data?.email) throw new Error("Username not found.");
    return data.email as string;
  }

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
        throw new Error("Username must be 3–20 characters (letters, numbers, underscore, dot).");
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
          data: { username: cleanUser },
        },
      });
      if (error) throw error;

      const userId = data.user?.id;
      if (userId) {
        await supabase.from("profiles").upsert({ user_id: userId, username: cleanUser, email: cleanEmail });
      }

      setOk("Check your inbox to confirm your email. You can log in once confirmed.");
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
      const targetEmail = clean.includes("@") ? clean : await resolveEmailFromUsername(clean);

      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/reset` : undefined,
      });
      if (error) throw error;
      setOk("Password reset email sent.");
    } catch (e: any) {
      setErr(e?.message || "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-card">
        {/* header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-md p-2 text-muted hover:bg-surface2 hover:text-text"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 pt-4 pb-6">
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-muted">Welcome back.</p>

              <div>
                <label className="mb-1 block text-sm text-muted">Email (or Username)</label>
                <input
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@email.com / yourname"
                  className="w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">Password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <div className="mt-1 text-right">
                  <button
                    type="button"
                    onClick={() => switchTo("reset")}
                    className="text-xs text-muted underline-offset-2 hover:text-text hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {err && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert" aria-live="polite">
                  {err}
                </div>
              )}
              {ok && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300" role="status" aria-live="polite">
                  {ok}
                </div>
              )}

              <button type="submit" disabled={busy} className="btn-accent w-full">
                {busy ? "Logging in…" : "Log In"}
              </button>

              <button
                type="button"
                onClick={continueAsGuest}
                className="w-full rounded-xl border border-border bg-surface2 px-4 py-3 text-text hover:bg-surface"
              >
                Continue as guest
              </button>

              <p className="pt-1 text-center text-sm text-muted">
                Don’t have an account?{" "}
                <button type="button" onClick={() => switchTo("signup")} className="font-medium text-accent hover:text-accent-hover">
                  Sign Up
                </button>
              </p>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <p className="text-muted">Let’s get you set up.</p>

              <div>
                <label className="mb-1 block text-sm text-muted">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourname"
                  className="w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              {err && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert" aria-live="polite">
                  {err}
                </div>
              )}
              {ok && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300" role="status" aria-live="polite">
                  {ok}
                </div>
              )}

              <button type="submit" disabled={busy} className="btn-accent w-full">
                {busy ? "Creating…" : "Sign Up"}
              </button>

              <p className="pt-1 text-center text-sm text-muted">
                Already have an account?{" "}
                <button type="button" onClick={() => switchTo("login")} className="font-medium text-accent hover:text-accent-hover">
                  Log In
                </button>
              </p>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-muted">Enter your email (or username) and we’ll send a reset link.</p>
              <div>
                <label className="mb-1 block text-sm text-muted">Email or Username</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@email.com / yourname"
                  className="w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              {err && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert" aria-live="polite">
                  {err}
                </div>
              )}
              {ok && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300" role="status" aria-live="polite">
                  {ok}
                </div>
              )}

              <button type="submit" disabled={busy} className="btn-accent w-full">
                {busy ? "Sending…" : "Send reset link"}
              </button>

              <p className="pt-1 text-center text-sm text-muted">
                <button type="button" onClick={() => switchTo("login")} className="font-medium text-accent hover:text-accent-hover">
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
