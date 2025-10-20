"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

type Mode = "signin" | "signup" | "forgot" | "chooser";

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
  const search = useSearchParams();
  const dialogRef = useRef<HTMLDivElement>(null);

  /* ---------- helpers ---------- */
  const openWith = (m: Mode) => {
    setMode(m);
    setErr(null);
    setOpen(true);
  };

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent).detail as Mode | undefined;
      openWith(d ?? "chooser");
    };
    window.addEventListener("auth:open", onOpen as EventListener);
    return () => window.removeEventListener("auth:open", onOpen as EventListener);
  }, []);

  useEffect(() => {
    const a = search.get("auth");
    if (a === "signin" || a === "signup" || a === "chooser") {
      openWith(a);
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      window.history.replaceState({}, "", url.toString());
    }
  }, [search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus trap + scroll lock
  useEffect(() => {
    if (!open) return;
    const root = dialogRef.current!;
    const focusables =
      root.querySelectorAll<HTMLElement>(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
      ) || [];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        (last as HTMLElement)?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        (first as HTMLElement)?.focus();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    first?.focus();

    window.addEventListener("keydown", trap);
    return () => {
      window.removeEventListener("keydown", trap);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, mode]);

  /* ---------- actions ---------- */
  const continueAsGuest = () => {
    try { localStorage.setItem("guest_mode", "true"); } catch {}
    window.dispatchEvent(new Event("guest:enabled"));
    setOpen(false);
    router.push("/dashboard");
    setTimeout(() => router.refresh(), 0);
  };

  const onSignIn = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
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
      <div ref={dialogRef} role="dialog" aria-modal="true" className="modal w-full max-w-md">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === "chooser" ? "Get Started" : mode === "signin" ? "Sign In" : mode === "signup" ? "Sign Up" : "Forgot Password"}
          </h2>
          <button className="btn-ghost px-2 py-1 text-sm" onClick={() => setOpen(false)}>Close</button>
        </div>

        {/* Error */}
        {err && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}

        {/* --- CHOOSER --- */}
        {mode === "chooser" && (
          <div className="grid gap-3">
            <button className="btn-accent w-full h-12 text-base">Sign In</button>
            <button className="btn-ghost  w-full h-12 text-base" onClick={() => setMode("signup")}>
              Create an account
            </button>
            <button className="btn-ghost  w-full h-12 text-base" onClick={continueAsGuest}>
              Continue as guest
            </button>
          </div>
        )}

        {/* --- SIGN IN --- */}
        {mode === "signin" && (
          <div className="grid gap-4">
            <div className="grid gap-1">
              <label className="label text-[13px]">Email</label>
              <input
                className="input h-11"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <label className="label text-[13px]">Password</label>
              <input
                className="input h-11"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="btn-accent w-full h-12 text-base" onClick={onSignIn} disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <div className="mt-1 grid gap-2 text-center text-sm text-muted">
              <button className="text-accent hover:underline" onClick={() => setMode("signup")}>Create an account</button>
              <button className="hover:underline" onClick={continueAsGuest}>Continue as guest</button>
              <button className="hover:underline" onClick={() => setMode("forgot")}>Forgot password?</button>
            </div>
          </div>
        )}

        {/* --- SIGN UP --- */}
        {mode === "signup" && (
          <div className="grid gap-4">
            <div className="grid gap-1">
              <label className="label text-[13px]">Username</label>
              <input
                className="input h-11"
                placeholder="uwy"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <label className="label text-[13px]">Email</label>
              <input
                className="input h-11"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <label className="label text-[13px]">Password</label>
              <input
                className="input h-11"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="btn-accent w-full h-12 text-base" onClick={onSignUp} disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </button>

            <div className="mt-1 text-center text-sm text-muted">
              Already have an account?{" "}
              <button className="text-accent hover:underline" onClick={() => setMode("signin")}>Sign In</button>
            </div>
          </div>
        )}

        {/* --- FORGOT --- */}
        {mode === "forgot" && (
          <div className="grid gap-4">
            <div className="grid gap-1">
              <label className="label text-[13px]">Email</label>
              <input
                className="input h-11"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button className="btn-accent w-full h-12 text-base" onClick={onForgot} disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </button>

            <div className="mt-1 text-center text-sm text-muted">
              <button className="hover:underline" onClick={() => setMode("signin")}>Back to sign in</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

