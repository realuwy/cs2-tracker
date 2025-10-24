// src/components/ContactModalHost.tsx
"use client";

import { useEffect, useState } from "react";

type Payload = { username?: string; email: string; message: string };

export default function ContactModalHost() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Allow other components to open this modal
  useEffect(() => {
    const onOpen = () => {
      setNotice(null);
      setError(null);
      setOpen(true);
    };
    window.addEventListener("contact:open", onOpen as EventListener);
    return () => window.removeEventListener("contact:open", onOpen as EventListener);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function resetForm() {
    setUsername("");
    setEmail("");
    setMessage("");
  }

  async function onSend() {
    try {
      setSending(true);
      setError(null);
      setNotice(null);

      const payload: Payload = {
        username: username.trim() || undefined,
        email: email.trim(),
        message: message.trim(),
      };

      if (!payload.email || !payload.message) {
        throw new Error("Please enter your email and a message.");
      }

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not send your message.");

      setNotice("Thanks — your message was sent.");
      resetForm();
      setTimeout(() => setOpen(false), 900);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-7 shadow-card text-text">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[28px] leading-none font-extrabold tracking-tight">Let’s talk</h2>
            <p className="mt-2 text-sm text-muted">
              Tell us what’s up. Leave an email so we can reply.
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="mt-1 rounded-lg border border-border bg-surface2/70 px-2 py-1 text-sm hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            Close
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
        {notice && (
          <div className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {notice}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend(); // <-- defined above
          }}
          className="mt-6 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <input
              aria-label="Username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 h-12 rounded-full border border-border bg-surface2/70 px-5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <input
              type="email"
              required
              aria-label="Email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12 rounded-full border border-border bg-surface2/70 px-5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <textarea
            required
            aria-label="Message"
            placeholder="How can we help?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-36 rounded-2xl border border-border bg-surface2/70 p-4 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
          />

          <p className="text-center text-xs text-muted">
            We’ll use your email only to reply. No spam.
          </p>

          <button
            type="submit"
            disabled={sending || !email.trim() || !message.trim()}
            className="btn-accent w-full h-12 rounded-full text-base font-semibold disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>
    </div>
  );
}
