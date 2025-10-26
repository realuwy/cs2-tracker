"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthModalHost() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // open/close via window events so buttons can trigger it
  useEffect(() => {
    const onOpen = () => { setOpen(true); setStep("email"); setMsg(null); setCode(""); };
    const onClose = () => setOpen(false);
    window.addEventListener("auth:open", onOpen);
    window.addEventListener("auth:close", onClose);
    return () => {
      window.removeEventListener("auth:open", onOpen);
      window.removeEventListener("auth:close", onClose);
    };
  }, []);

  async function sendCode() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send code");
      setStep("code");
      setMsg("We emailed you a 6-digit code. It expires in 10 minutes.");
    } catch (e: any) {
      setMsg(e.message || "Could not send code");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Invalid code");

      // store simple auth
      localStorage.setItem("cs2:email", email.trim().toLowerCase());
      localStorage.setItem("cs2:token", data.token);
      window.dispatchEvent(new Event("auth:changed"));

      setOpen(false);
      router.replace("/dashboard");
    } catch (e: any) {
      setMsg(e.message || "Could not verify code");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-6 text-white shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {step === "email" ? "Sign in with email" : "Enter your code"}
          </h2>
          <button
            className="rounded-md px-2 py-1 text-zinc-300 hover:bg-zinc-800"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>

        {step === "email" ? (
          <>
            <p className="mb-3 text-sm text-zinc-300">
              Use your email to keep your inventory saved across devices and receive your sign-in code.
            </p>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
            />
            {msg && <p className="mt-2 text-sm text-amber-300">{msg}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                disabled={busy || !email}
                onClick={sendCode}
                className="rounded-lg bg-accent px-3 py-2 text-sm text-black hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Sending…" : "Continue"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-zinc-300">
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
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-center text-lg tracking-widest outline-none focus:ring-2 focus:ring-accent/30"
              maxLength={6}
            />
            {msg && <p className="mt-2 text-sm text-amber-300">{msg}</p>}
            <div className="mt-4 flex items-center justify-between">
              <button
                disabled={busy}
                onClick={() => setStep("email")}
                className="rounded-lg px-3 py-2 text-sm hover:bg-zinc-800"
              >
                Change email
              </button>
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  onClick={sendCode}
                  className="rounded-lg px-3 py-2 text-sm hover:bg-zinc-800"
                >
                  Resend
                </button>
                <button
                  disabled={busy || code.length < 6}
                  onClick={verifyCode}
                  className="rounded-lg bg-accent px-3 py-2 text-sm text-black hover:opacity-90 disabled:opacity-60"
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

