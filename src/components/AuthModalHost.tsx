"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

type Mode = "chooser" | "signin" | "signup" | "forgot";
type OpenDetail = Mode | "guest" | "choose" | undefined;

export default function AuthModalHost() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("chooser");

  // form fields
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

  const openWith = (next: Mode = "chooser") => {
    setMode(next);
    setErr(null);
    setPassword("");
    if (next !== "signup") {
      setUsername("");
      setEmail("");
    }
    if (next !== "signin") setEmailOrUsername("");
    setOpen(true);
  };

  const continueAsGuest = () => {
    try {
      window.localStorage.setItem("guest_mode", "true");
    } catch {}
    setOpen(false);
    router.push("/dashboard");
  };

  // Global trigger
  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<OpenDetail>).detail;
      if (d === "guest") return continueAsGuest();
      if (d === "choose") return openWith("chooser");
      openWith((d as Mode) ?? "chooser");
    };
    window.addEventListener("auth:open", onOpen as EventListener);
    return () => window.removeEventListener("auth:open", onOpen as EventListener);
  }, []);

  // URL trigger: /?auth=choose|signin|signup|guest
  useEffect(() => {
    const auth = search.get("auth") as OpenDetail;
    if (!auth) return;
    if (auth === "guest") continueAsGuest();
    else if (auth === "choose") openWith("chooser");
    else openWith((auth as Mode) ?? "chooser");

    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    window.history.replaceState({}, "", url.toString());
  }, [search]);

  // Esc + scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => void (document.body.style.overflow = prev);
  }, [open]);

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dialogRef.current) return;
    if (!dialogRef.current.contains(e.target as Node)) setOpen(false);
  };

  // Actions
  const onSignIn = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await supabase.auth.signInWithPassword({
        email: emailOrUsername, // add username->email lookup later if you want
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onMouseDown={onBackdropClick}
    >
      <div
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-text shadow-card"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {mode === "chooser"
              ? "Get Started"
              : mode === "signin"
              ? "Sign In"
              : mode === "signup"
              ? "Sign Up"
              : "Forgot Password"}
          </h2>
          <button onClick={() => setOpen(false)} className="btn-ghost px-2 py-1 text-sm">
            Close
          </button>
        </div>

        {err && (
          <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}

        {/* ---------- CHOOSER ---------- */}
        {mode === "chooser" && (
          <div className="space-y-3">
            <button onClick={() => openWith("signin")} className="btn-accent w-full">
              Sign In
            </button>
            <button onClick={() => openWith("signup")} className="btn-ghost w-full">
              Create an account
            </button>
            <button onClick={continueAsGuest} className="btn-ghost w-full">
              Continue as guest
            </button>
          </div>
        )}

        {/* ---------- SIGN IN ---------- */}
        {mode === "signin" && (
          <>
            <label className="mb-2 block text-sm text-muted">Email (or username)</label>
            <input
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              className="mb-3 w-full rounded-xl border border-border bg-surface2/70 px-3 py-2 text-text placeholder-muted outline-none focus:ring-2 focus:ring-accent/30"
            />
            <label className="mb-2 block text-sm text-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-5 w-full rounded-xl border border-border bg-surface2/70 px-3 py-2 text-text placeholder-muted outline-none focus:ring-2 focus:ring-accent/30"
            />
            <button onClick={onSignIn} disabled={loading} className="btn-accent mb-3 w-full disabled:opacity-60">
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <div className="mt-3 space-y-2 text-center text-sm">
              <button onClick={() => openWith("signup")} className="text-accent hover:underline">
                Create an account
              </button>
              <br />
              <button onClick={continueAsGuest} className="link-muted hover:underline">
                Continue as guest
              </button>
              <br />
              <button onClick={() => openWith("forgot")} className="link-muted hover:underline">
                Forgot password?
              </button>
            </div>
          </>
        )}

        {/* ---------- SIGN UP ---------- */}
        {mode === "signup" && (
          <>
            <label className="mb-2 block text-sm text-muted">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="uwy"
              autoFocus
              className="mb-3 w-full rounded-xl border border-border bg-surface2/70 px-3 py-2 text-text placeholder-muted outline-none focus:ring-2 focus:ring-accent/30"
            />
            <label className="mb-2 block text-sm text-muted">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mb-3 w-full rounded-xl border border-border bg-surface2/70 px-3 py-2 text-text placeholder-muted outline-none focus:ring-2 focus:ring-accent/30"
            />
            <label className="mb-2 block text-sm text-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-5 w-full rounded-xl border border-border bg-surface2/70 px-3 py-2 text-text placeholder-muted outline-none focus:ring-2 focus:ring-accent/30"
            />
            <button onClick={onSignUp} disabled={loading} className="btn-accent mb-3 w-full disabled:opacity-60">
              {loading ? "Creating…" : "Create account"}
            </button>

            <div className="mt-3 text-center text-sm text-muted">
              Already have an account?{" "}
              <button onClick={() => openWith("signin")} className="text-accent hover:underline">
                Sign In
              </button>
              <br />
              <button onClick={continueAsGuest} className="mt-2 link-muted hover:underline">
                Continue as guest
              </button>
            </div>
          </>
        )}

        {/* ---------- FORGOT ---------- */}
        {mode === "forgot" && (
          <>
            <label className="mb-2 block text-sm text-muted">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              className="mb-5 w-full rounded-xl border border-border bg-surface2/70 px-3 py-2 text-text placeholder-muted outline-none focus:ring-2 focus:ring-accent/30"
            />
            <button onClick={onForgot} disabled={loading} className="btn-accent mb-3 w-full disabled:opacity-60">
              {loading ? "Sending…" : "Send reset link"}
            </button>

            <div className="mt-3 text-center text-sm">
              <button onClick={() => openWith("signin")} className="link-muted hover:underline">
                Back to sign in
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
