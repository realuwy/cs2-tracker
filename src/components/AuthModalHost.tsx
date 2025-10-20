// src/components/AuthModalHost.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

type Mode = "signin" | "signup" | "forgot" | "chooser";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    // eye-off
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden className="opacity-80">
      <path
        d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 5.46A9.77 9.77 0 0112 5c5.52 0 9 5 9 7-0 1.02-0.87 2.63-2.35 4.03M6.35 6.35C4.87 7.75 4 9.36 4 10c0 2 3.48 7 8 7 1.02 0 2.03-.2 2.97-.58"
        stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  ) : (
    // eye
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden className="opacity-80">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PillInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={[
        "w-full h-12 rounded-2xl border border-border bg-surface2/70",
        "px-4 pr-11 text-[15px] text-text placeholder:text-muted",
        "outline-none focus:ring-2 focus:ring-accent/30",
        className,
      ].join(" ")}
    />
  );
}

export default function AuthModalHost() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const supabase = getSupabaseClient();
  const router = useRouter();
  const search = useSearchParams();
  const dialogRef = useRef<HTMLDivElement>(null);

  /* ------------------ open helpers ------------------ */
  const openWith = (m: Mode) => {
    setMode(m);
    setErr(null);
    setShowPass(false);
    setOpen(true);
  };

  // Global trigger
  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent).detail as Mode | undefined;
      openWith(d ?? "chooser");
    };
    window.addEventListener("auth:open", onOpen as EventListener);
    return () => window.removeEventListener("auth:open", onOpen as EventListener);
  }, []);

  // URL trigger ?auth=chooser|signin|signup
  useEffect(() => {
    const a = search.get("auth");
    if (a === "signin" || a === "signup" || a === "chooser") {
      openWith(a);
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      window.history.replaceState({}, "", url.toString());
    }
  }, [search]);

  // Escape to close
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
        e.preventDefault(); (last as HTMLElement)?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); (first as HTMLElement)?.focus();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    first?.focus();

    window.addEventListener("keydown", trap);
    return () => { window.removeEventListener("keydown", trap); document.body.style.overflow = prevOverflow; };
  }, [open, mode]);

  /* ------------------ actions ------------------ */
  const continueAsGuest = () => {
    try { localStorage.setItem("guest_mode", "true"); } catch {}
    window.dispatchEvent(new Event("guest:enabled"));
    setOpen(false);
    router.push("/dashboard");
    setTimeout(() => router.refresh(), 0);
  };

  const onSignIn = async () => {
    setLoading(true); setErr(null);
    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) throw res.error;
      setOpen(false); router.push("/dashboard");
    } catch (e: any) {
      setErr(e?.message ?? "Sign in failed");
    } finally { setLoading(false); }
  };

  const onSignUp = async () => {
    setLoading(true); setErr(null);
    try {
      const res = await supabase.auth.signUp({
        email, password, options: { data: { username } },
      });
      if (res.error) throw res.error;
      setOpen(false); router.push("/dashboard");
    } catch (e: any) {
      setErr(e?.message ?? "Sign up failed");
    } finally { setLoading(false); }
  };

  const onForgot = async () => {
    setLoading(true); setErr(null);
    try {
      const res = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? `${location.origin}/reset` : undefined,
      });
      if (res.error) throw res.error;
      setErr("If that email exists, a reset link has been sent.");
    } catch (e: any) {
      setErr(e?.message ?? "Could not start reset");
    } finally { setLoading(false); }
  };

  if (!open) return null;

  /* -------------- Shared header copy -------------- */
  const headline =
    mode === "signup"
      ? "Let’s Get Started"
      : mode === "signin"
      ? "Welcome Back"
      : mode === "forgot"
      ? "Forgot Password"
      : "Get Started";

  const sub =
    mode === "signup"
      ? "Now create your account!"
      : mode === "signin"
      ? "Sign in to continue."
      : mode === "forgot"
      ? "We’ll email you a reset link."
      : "Choose how you’d like to start.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div ref={dialogRef} role="dialog" aria-modal="true" className="modal w-full max-w-md p-7">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-[28px] font-extrabold leading-[1.15] tracking-tight">{headline}</h2>
            <p className="mt-1 text-sm text-muted">{sub}</p>
          </div>
          <button className="btn-ghost px-2 py-1 text-sm" onClick={() => setOpen(false)}>Close</button>
        </div>

        {/* Error */}
        {err && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}

        {/* ---------------- CHOOSER ---------------- */}
        {mode === "chooser" && (
          <div className="grid gap-3">
            <button
              className="btn-accent h-12 w-full rounded-2xl text-base"
              onClick={() => setMode("signin")}
            >
              Sign In
            </button>
            <button
              className="btn-ghost h-12 w-full rounded-2xl text-base"
              onClick={() => setMode("signup")}
            >
              Create an account
            </button>
            <button
              className="btn-ghost h-12 w-full rounded-2xl text-base"
              onClick={continueAsGuest}
            >
              Continue as guest
            </button>
          </div>
        )}

        {/* ---------------- SIGN IN ---------------- */}
        {mode === "signin" && (
          <div className="grid gap-3">
            <PillInput
              aria-label="Email"
              placeholder="Enter your email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="relative">
              <PillInput
                aria-label="Password"
                placeholder="Password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-text"
                onClick={() => setShowPass((v) => !v)}
              >
                <EyeIcon open={showPass} />
              </button>
            </div>

            <button className="btn-accent mt-1 h-12 w-full rounded-2xl text-base" onClick={onSignIn} disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <div className="mt-2 grid gap-2 text-center text-sm text-muted">
              <button className="text-accent hover:underline" onClick={() => setMode("signup")}>
                Create an account
              </button>
              <button className="hover:underline" onClick={continueAsGuest}>
                Continue as guest
              </button>
              <button className="hover:underline" onClick={() => setMode("forgot")}>
                Forgot password?
              </button>
            </div>
          </div>
        )}

        {/* ---------------- SIGN UP ---------------- */}
        {mode === "signup" && (
          <div className="grid gap-3">
            <PillInput
              aria-label="Username"
              placeholder="Full name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <PillInput
              aria-label="Email"
              placeholder="Enter your email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="relative">
              <PillInput
                aria-label="Password"
                placeholder="Password"
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-text"
                onClick={() => setShowPass((v) => !v)}
              >
                <EyeIcon open={showPass} />
              </button>
            </div>

            <button className="btn-accent mt-1 h-12 w-full rounded-2xl text-base" onClick={onSignUp} disabled={loading}>
              {loading ? "Creating…" : "Sign up"}
            </button>

            <div className="mt-2 text-center text-sm text-muted">
              Already have an account?{" "}
              <button className="text-accent hover:underline" onClick={() => setMode("signin")}>
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* ---------------- FORGOT ---------------- */}
        {mode === "forgot" && (
          <div className="grid gap-3">
            <PillInput
              aria-label="Email"
              placeholder="you@example.com"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button className="btn-accent mt-1 h-12 w-full rounded-2xl text-base" onClick={onForgot} disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </button>

            <div className="mt-2 text-center text-sm text-muted">
              <button className="hover:underline" onClick={() => setMode("signin")}>
                Back to sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
