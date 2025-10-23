"use client";

import { useEffect, useState } from "react";

export default function ContactModalHost() {
  const [open, setOpen] = useState(false);

  // form fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  // hidden honeypot
  const [honey, setHoney] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Allow opening via URL (?contact=1) without useSearchParams (avoids Suspense requirement)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("contact")) {
      setOpen(true);
      params.delete("contact");
      const url = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", url);
    }
  }, []);

  // Open via global event: window.dispatchEvent(new CustomEvent("contact:open"))
  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setNotice(null);
      setError(null);
    };
    window.addEventListener("contact:open", onOpen as EventListener);
    return () => window.removeEventListener("contact:open", onOpen as EventListener);
  }, []);

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setMessage("");
    setHoney("");
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!message || message.trim().length < 5) {
      setError("Please write a short message (at least a few words).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ username, email, message, honey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setNotice("Thanks! We received your message and will get back to you.");
      // Auto-close after a short delay
      setTimeout(() => {
        setOpen(false);
        resetForm();
        setNotice(null);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to send message. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 text-text shadow-card">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Let’s talk</h2>
            <p className="mt-2 text-sm text-muted">
              Tell us what’s up. Leave an email so we can reply.
            </p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              setTimeout(() => resetForm(), 150);
            }}
            className="btn-ghost !px-3 !py-1 text-sm"
          >
            Close
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {notice}
          </div>
        )}

      {/* Form */}
<form
  onSubmit={(e) => {
    e.preventDefault();
    onSend();
  }}
  className="mt-6 space-y-4"
>
  {/* Top Row */}
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
      aria-label="Email"
      required
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="flex-1 h-12 rounded-full border border-border bg-surface2/70 px-5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
    />
  </div>

  {/* Message */}
  <textarea
    aria-label="Message"
    placeholder="Write your message..."
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    className="w-full h-36 rounded-2xl border border-border bg-surface2/70 p-4 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
  />

  {/* Footer */}
  <p className="text-xs text-muted text-center">
    We’ll use your email only to reply. No spam.
  </p>

  <button
    type="submit"
    disabled={sending || !email.trim() || !message.trim()}
    className="btn-accent w-full h-12 rounded-full text-base font-semibold disabled:opacity-60"
  >
    {sending ? "Sending..." : "Send message"}
  </button>
</form>

      </div>
    </div>
  );
}
