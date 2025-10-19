"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

type Mode = "signin" | "signup" | "forgot";

export default function AuthModalHost() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");

  const [emailOrUsername, setEmailOrUsername] = useState(""); // signin
  const [email, setEmail] = useState("");                     // signup/forgot
  const [username, setUsername] = useState("");               // signup
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const supabase = getSupabaseClient();
  const router = useRouter();
  const search = useSearchParams();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  /** Centralized open that always resets to a safe state */
  const openWith = (next: Mode = "signin") => {
    setMode(next);
    setErr(null);
    setPassword("");
    // keep what makes sense: clear signin field only if switching away from forgot/signup noise
    if (next === "signin") {
      setEmailOrUsername("");
    }
    if (next !== "signup") {
      setUsername("");
      setEmail("");
    }
    setOpen(true);
  };

  /* ---------------------------- Triggers ---------------------------- */
  // Global event trigger
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as Mode | undefined;
      openWith(detail ?? "signin");
    };
    window.addEventListener("auth:open", onOpen as EventListener);
    return () => window.removeEventListener("auth:open", onOpen as EventListener);
  }, []);

  // URL trigger: /?auth=signin or /?auth=signup
  useEffect(() => {
    const auth = search.get("auth");
    if (auth === "signin" || auth === "signup") {
      openWith(auth);
      // Clean the URL so refresh doesn't reopen
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      window.history.replaceState({}, "", url.toString());
    }
  }, [search]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Backdrop click to close
  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dialogRef.current) return;
    if (!dialogRef.current.contains(e.target as Node)) setOpen(false);
  };

  /* ----------------------------- Actions ---------------------------- */
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
      // If you add username->email lookup later, swap emailOrUsername accordingly.
      const res = await supabase.auth.signInWithPassword({
        email: emailOrUsername,
        password,
      });
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
        redirectTo:
          typeof window !== "undefined" ? `${location.origin}/reset` : undefined,
      });
      if (res.error) throw res.error;
      setErr("If that email exists, a reset link has been sent.");
    } catch (e: any) {
      setErr(e?.message ?? "Could not start reset");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------ Render ---------------------------- */
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onMouseDown={onBackdropClick}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-xl bg-zinc-900 p-6 text-white shadow-lg ring-1 ring-white/10"
        onMouseDown={(e) => e.stopPropagation()}
      >
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

        {/* ---------------------------- SIGN IN ---------------------------- */}
        {mode === "signin" && (
          <>
            <label className="mb-2 block text-sm">Email (or username)</label>
            <input
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="you@example.com"
              autoFocus
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

            {/* Continue as guest – visible on Sign In */}
            <button
              onClick={continueAsGuest}
              className="mb-2 w-full rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
            >
              Continue as guest
            </button>

            <div className="mt-3 text-center text-sm text-zinc-400">
              Need an account?{" "}
              <button
                onClick={() => openWith("signup")}
                className="font-medium text-lime-300 hover:underline"
              >
                Sign Up
              </button>
              <br />
              <button
                onClick={() => openWith("forgot")}
                className="mt-2 text-zinc-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </>
        )}

        {/* ---------------------------- SIGN UP ---------------------------- */}
        {mode === "signup" && (
          <>
            <label className="mb-2 block text-sm">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="uwy"
              autoFocus
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
                onClick={() => openWith("signin")}
                className="font-medium text-lime-300 hover:underline"
              >
                Sign In
              </button>
            </div>
          </>
        )}

        {/* --------------------------- FORGOT PASS -------------------------- */}
        {mode === "forgot" && (
          <>
            <label className="mb-2 block text-sm">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
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
                onClick={() => openWith("signin")}
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

