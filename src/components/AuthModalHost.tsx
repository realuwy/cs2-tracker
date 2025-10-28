// src/components/AuthModalHost.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthModalHost() {
  const router = useRouter();

  // modal state
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"email" | "code">("email");

  // form state
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  // ui state
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Open/close via global events (used by header buttons, etc.)
  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setStep("email");
      setMsg(null);
      setCode("");
    };
    const onClose = () => setOpen(false);

    window.addEventListener("auth:open", onOpen);
    window.addEventListener("auth:close", onClose);
    return () => {
      window.removeEventListener("auth:open", onOpen);
      window.removeEventListener("auth:close", onClose);
    };
  }, []);

  // --- Actions -------------------------------------------------------------

  async function sendCode() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to send code");

      setStep("code");
      setMsg("We emailed you a 6-digit code. It expires in 10 minutes.");
    } catch (e: any) {
      setMsg(e?.message || "Could not send code");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Invalid code");

      // Optional: keep a local note of the email for client UI (server session lives in cookie)
      try {
        localStorage.setItem("cs2:email", email.trim().toLowerCase());
      } catch {}

      // Let the rest of the app refresh its auth state
      window.dispatchEvent(new Event("auth:changed"));
      try {
        router.refresh?.();
      } catch {}

      setOpen(false);
      router.push("/dashboard");
    } catch (e: any) {
      setMsg(e?.message || "Could not verify code");
    } finally {
      setBusy(false);
    }
  }

  // ------------------------------------------------------------------------

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-text shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {step === "email" ? "Sign in with email" : "Enter your code"}
          </h2>
          <button
            className="rounded-md px-2 py-1 text-muted hover:bg-surface2"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        {step === "email" ? (
          <>
            <p className="mb-3 text-sm text-muted">
              Use your email to keep your inventory synced across devices. We’ll send a one-time
              code to sign in.
            </p>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-surface2 p-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
            />
            {msg && <p className="mt-2 text-sm text-amber-300">{msg}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                disabled={busy || !email.trim()}
                onClick={sendCode}
                className="btn-accent rounded-lg px-3 py-2 text-sm disabled:opacity-60"
              >
                {busy ? "Sending…" : "Continue"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted">
              We sent a 6-digit code to <span className="font-medium">{email}</span>.
            </p>
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full rounded-lg border border-border bg-surface2 p-2 text-center text-lg tracking-widest outline-none focus:ring-2 focus:ring-accent/30"
            />
            {msg && <p className="mt-2 text-sm text-amber-300">{msg}</p>}

            <div className="mt-4 flex items-center justify-between">
              <button
                disabled={busy}
                onClick={() => setStep("email")}
                className="rounded-lg px-3 py-2 text-sm hover:bg-surface2"
              >
                Change email
              </button>
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  onClick={sendCode}
                  className="rounded-lg px-3 py-2 text-sm hover:bg-surface2"
                >
                  Resend
                </button>
                <button
                  disabled={busy || code.trim().length < 6}
                  onClick={verifyCode}
                  className="btn-accent rounded-lg px-3 py-2 text-sm disabled:opacity-60"
                >
                  {busy ? "Checking…" : "Verify"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

