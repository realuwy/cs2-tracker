"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-2 py-1 text-sm hover:bg-surface2/70"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default function AuthModalHost() {
  const supabase = getSupabaseClient();
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup" | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Open from header via window event
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent<string>).detail;
      setMode(d === "signup" ? "signup" : "signin");
      setErr(null);
    };
    window.addEventListener("auth:open", handler as any);
    return () => window.removeEventListener("auth:open", handler as any);
  }, []);

  const close = () => setMode(null);

  // shared fields
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(""); // signup only
  const [password, setPassword] = useState("");

  const signIn = async () => {
    try {
      setBusy(true);
      setErr(null);
      // username or email allowed: if looks like an email use it, else treat as username by querying
      let emailToUse = email;
      if (!email.includes("@")) {
        // You can replace this with a proper RLS function if you add it later.
        // For now: assume user enters email here (simpler UX).
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });
      if (error) throw error;
      window.localStorage.removeItem("guest_mode");
      close();
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const signUp = async () => {
    try {
      setBusy(true);
      setErr(null);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username.trim() || null },
          emailRedirectTo: undefined, // no email verification flow
        },
      });
      if (error) throw error;
      window.localStorage.removeItem("guest_mode");
      close();
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  if (!mode) return null;

  return (
    <ModalShell
      title={mode === "signin" ? "Sign In" : "Create an Account"}
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mode === "signin" ? signIn() : signUp();
        }}
        className="space-y-3"
      >
        {mode === "signup" && (
          <div>
            <label className="mb-1 block text-xs text-muted">Username</label>
            <input
              className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="uwais11"
              required
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs text-muted">
            {mode === "signin" ? "Email" : "Email"}
          </label>
          <input
            type="email"
            className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Password</label>
          <input
            type="password"
            className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {err && (
          <div className="rounded-lg border border-red-400/40 bg-red-400/10 p-2 text-sm text-red-200">
            {err}
          </div>
        )}

        <div className="pt-1">
          <button
            type="submit"
            disabled={busy}
            className="btn-accent w-full py-2 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </div>

        {mode === "signin" && (
          <div className="text-center text-sm">
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("auth:open", { detail: "signup" })
                )
              }
            >
              Need an account? Sign Up
            </button>
          </div>
        )}
        {mode === "signup" && (
          <div className="text-center text-sm">
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("auth:open", { detail: "signin" })
                )
              }
            >
              Already have an account? Sign In
            </button>
          </div>
        )}

        {mode === "signin" && (
          <div className="text-center text-sm">
            <LinkButton href="/reset">Forgot password?</LinkButton>
          </div>
        )}
      </form>
    </ModalShell>
  );
}

/** Minimal inline link-like button */
function LinkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="text-accent hover:underline">
      {children}
    </a>
  );
}
