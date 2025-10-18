"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

/** Helper: is it an email-looking identifier? */
const looksLikeEmail = (s: string) => /\S+@\S+\.\S+/.test(s);

/** Merge current guest dashboard into account after auth */
async function mergeGuestIntoAccount() {
  try {
    const raw = localStorage.getItem("cs2:dashboard:rows");
    if (!raw) return;
    const rows = JSON.parse(raw);
    // Your Dashboard already upserts on change, but doing a nudge right after sign-in helps.
    await fetch("/api/account/rows/upsert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rows }),
    }).catch(() => {});
  } catch {}
}

export default function AuthPanel() {
  const supabase = getSupabaseClient();
  const router = useRouter();

  const [mode, setMode] = useState<"signup" | "signin" | "forgot">("signup");
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState(""); // email or username (for sign-in)
  const [email, setEmail] = useState("");           // sign-up & forgot
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    setMsg(null);
  }, [mode]);

  async function upsertProfile({ user_id, username, email }: { user_id: string; username: string; email: string }) {
    // Insert-or-update the mapping row
    await supabase.from("profiles").upsert({ user_id, username, email }).select().single();
  }

  async function doSignUp() {
    setErr(null); setMsg(null); setBusy(true);
    try {
      if (!username.trim() || !email.trim() || !password) {
        throw new Error("Please fill username, email and password.");
      }

      // Create auth user (no email verification required)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) {
        // Friendly duplicate message
        if (String(error.message).toLowerCase().includes("user already registered")) {
          throw new Error("That email already has an account.");
        }
        throw error;
      }

      const user = data.user;
      if (user?.id) {
        // Save username mapping
        await upsertProfile({ user_id: user.id, username, email });
      }

      // Immediately sign in the freshly created user (since no verification step)
      const signInRes = await supabase.auth.signInWithPassword({ email, password });
      if (signInRes.error) throw signInRes.error;

      // Merge guest rows into the new account
      await mergeGuestIntoAccount();

      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  async function doSignIn() {
    setErr(null); setMsg(null); setBusy(true);
    try {
      if (!identifier.trim() || !password) throw new Error("Enter your username/email and password.");

      let emailToUse = identifier;
      if (!looksLikeEmail(identifier)) {
        // Resolve username -> email
        const { data, error } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", identifier)
          .maybeSingle();

        if (error) throw error;
        if (!data?.email) throw new Error("Username not found.");
        emailToUse = data.email;
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });
      if (signInErr) {
        const em = String(signInErr.message || "").toLowerCase();
        if (em.includes("invalid login credentials")) throw new Error("Wrong email/username or password.");
        throw signInErr;
      }

      // Merge guest rows into this account on first sign-in
      await mergeGuestIntoAccount();

      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function doForgot() {
    setErr(null); setMsg(null); setBusy(true);
    try {
      if (!email.trim()) throw new Error("Enter your email.");
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? `${location.origin}/auth/reset` : undefined,
      });
      if (error) throw error;
      setMsg("Password reset email sent. Check your inbox.");
    } catch (e: any) {
      setErr(e?.message || "Could not send reset email");
    } finally {
      setBusy(false);
    }
  }

  function continueAsGuest() {
    try { localStorage.setItem("cs2:guest", "1"); } catch {}
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface/60 p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {mode === "signup" ? "Create an account" : mode === "signin" ? "Welcome back" : "Forgot password"}
        </h1>
        <div className="flex gap-1 text-sm">
          <button
            className={`rounded-md px-2 py-1 ${mode === "signup" ? "bg-surface2 text-text" : "text-muted hover:text-text"}`}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
          <button
            className={`rounded-md px-2 py-1 ${mode === "signin" ? "bg-surface2 text-text" : "text-muted hover:text-text"}`}
            onClick={() => setMode("signin")}
          >
            Sign In
          </button>
          <button
            className={`rounded-md px-2 py-1 ${mode === "forgot" ? "bg-surface2 text-text" : "text-muted hover:text-text"}`}
            onClick={() => setMode("forgot")}
          >
            Forgot
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {mode === "signup" && (
          <>
            <div>
              <label className="mb-1 block text-[12px] text-muted">Username</label>
              <input
                className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="myname"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-muted">Email</label>
              <input
                className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-muted">Password</label>
              <input
                className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </div>
          </>
        )}

        {mode === "signin" && (
          <>
            <div>
              <label className="mb-1 block text-[12px] text-muted">Username or Email</label>
              <input
                className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="myname or you@example.com"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-muted">Password</label>
              <input
                className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
          </>
        )}

        {mode === "forgot" && (
          <div>
            <label className="mb-1 block text-[12px] text-muted">Email</label>
            <input
              className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        )}

        {err && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-sm">{err}</div>}
        {msg && <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-sm">{msg}</div>}

        {mode === "signup" && (
          <button onClick={doSignUp} disabled={busy} className="btn-accent h-11 w-full disabled:opacity-60">
            {busy ? "Please wait…" : "Sign Up"}
          </button>
        )}
        {mode === "signin" && (
          <button onClick={doSignIn} disabled={busy} className="btn-accent h-11 w-full disabled:opacity-60">
            {busy ? "Please wait…" : "Sign In"}
          </button>
        )}
        {mode === "forgot" && (
          <button onClick={doForgot} disabled={busy} className="btn-accent h-11 w-full disabled:opacity-60">
            {busy ? "Please wait…" : "Send Reset Email"}
          </button>
        )}

        <div className="pt-2 text-center">
          <button type="button" onClick={continueAsGuest} className="text-sm text-muted underline hover:text-text">
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
