"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

type Mode = "signin" | "signup" | "forgot";

export default function AuthModalHost() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const supabase = getSupabaseClient();
  const router = useRouter();

  // Listen for global open events: window.dispatchEvent(new CustomEvent("auth:open", { detail: "signin" | "signup" }))
  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent).detail as Mode | undefined;
      setMode(d ?? "signin");
      setErr(null);
      setOpen(true);
    };
    window.addEventListener("auth:open", onOpen as EventListener);
    return () => window.removeEventListener("auth:open", onOpen as EventListener);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const continueAsGuest = () => {
    try {
      window.localStorage.setItem("guest_mode", "true");
    } catch {}
    setOpen(false);
    router.push("/dashboard");
  };

  const onSignIn = async () => {
    setLoading(true);
    setErr(null);
    try {
      // Support username OR email (Supabase: treat as email if contains "@")
      const isEmail = email.includes("@");
      let res;
      if (isEmail) {
        res = await supabase.auth.signInWithPassword({ email, password });
      } else {
        // username sign-in: look up email by username via RPC/edge function if you have it
        // fallback: try as email anyway (returns error quickly)
        res = await supabase.auth.signInWithPassword({ email, password });
      }
      if (res.error) throw res.error;
      setOpen(false);
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e?.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (res.error) throw res.error;
      // No email verification required → go to dashboard
      setOpen(false);
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e?.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? `${location.origin}/reset` : undefined,
      });
      if (res.error) throw res.error;
      setErr("If that email exists, a reset link has been sent.");
    } catch (e: any) {
      setErr(e?.message ?? "Could not start reset");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl bg-zinc-900 p-6 text-white shadow-lg ring-1 ring-white/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {mode === "signin" ? "Sign In" : mode === "signup" ? "Sign Up" : "Forgot Password"}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md border border-zinc-700 px-2 py-1 text-sm hover:bg-zinc-800"
          >
            Close
          </button>
        </div>

        {err && (
          <div className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}

        {/* Forms */}
        {mode === "signin" && (
          <>
            <label className="mb-2 block text-sm">Email (or username)</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none focus:ring-2 focus:ring-lime-400/40"
            />
            <label className="mb-2 block text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none focus:ring-2 focus:ring-lime-400/40"
            />
            <button
              onClick={onSignIn}
              disabled={loading}
              className="mb-3 w-full rounded-xl bg-lime-400 px-4 py-2 font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>

            {/* 🔹 Continue as guest lives here */}
            <button
              onClick={continueAsGuest}
              className="mb-2 w-full rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
            >
              Continue as guest
            </button>

            <div className="mt-3 text-center text-sm text-zinc-400">
              Need an account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="font-medium text-lime-300 hover:underline"
              >
                Sign Up
              </button>
              <br />
              <button
                onClick={() => setMode("forgot")}
                className="mt-2 text-zinc-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </>
        )}

        {mode === "signup" && (
          <>
            <label className="mb-2 block text-sm">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="uwy"
              className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none focus:ring-2 focus:ring-lime-400/40"
            />
            <label className="mb-2 block text-sm">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none focus:ring-2 focus:ring-lime-400/40"
            />
            <label className="mb-2 block text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none focus:ring-2 focus:ring-lime-400/40"
            />
            <button
              onClick={onSignUp}
              disabled={loading}
              className="mb-3 w-full rounded-xl bg-lime-400 px-4 py-2 font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
            >
              {loading ? "Creating…" : "Create account"}
            </button>

            <div className="mt-3 text-center text-sm text-zinc-400">
              Already have an account?{" "}
              <button
                onClick={() => setMode("signin")}
                className="font-medium text-lime-300 hover:underline"
              >
                Sign In
              </button>
            </div>
          </>
        )}

        {mode === "forgot" && (
          <>
            <label className="mb-2 block text-sm">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mb-5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none focus:ring-2 focus:ring-lime-400/40"
            />
            <button
              onClick={onForgot}
              disabled={loading}
              className="mb-3 w-full rounded-xl bg-lime-400 px-4 py-2 font-semibold text-black hover:bg-lime-300 disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>

            <div className="mt-3 text-center text-sm text-zinc-400">
              <button
                onClick={() => setMode("signin")}
                className="text-zinc-400 hover:underline"
              >
                Back to sign in
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
