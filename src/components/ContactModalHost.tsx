// src/components/ContactModalHost.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function ContactModalHost() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Open/close through window events
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener("contact:open", onOpen);
    window.addEventListener("contact:close", onClose);
    return () => {
      window.removeEventListener("contact:open", onOpen);
      window.removeEventListener("contact:close", onClose);
    };
  }, []);

  // Optional: ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleSend() {
    if (!email.trim() || !message.trim()) return;
    try {
      setSending(true);

      // TODO: replace this with your API route if desired
      // For now we use a safe mailto fallback that *stays* in the modal:
      const body = encodeURIComponent(
        [
          username ? `Username: ${username}` : null,
          `Email: ${email}`,
          "",
          message,
        ]
          .filter(Boolean)
          .join("\n")
      );
      const subject = encodeURIComponent("CS2 Tracker – Contact");

      // Create an invisible link and click it without leaving the current page
      const a = document.createElement("a");
      a.href = `mailto:cs2-tracker@proton.me?subject=${subject}&body=${body}`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setToast("Message ready to send in your mail app.");
      setTimeout(() => setToast(null), 3000);

      // keep the modal open so users see the toast; clear fields optionally:
      // setOpen(false);
      // setUsername(""); setEmail(""); setMessage("");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <>
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

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="mt-6 space-y-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                aria-label="Username"
                className="w-full h-12 rounded-full border border-border bg-surface2/70 px-5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                type="email"
                aria-label="Email"
                required
                className="w-full h-12 rounded-full border border-border bg-surface2/70 px-5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <textarea
              aria-label="Message"
              required
              className="w-full h-36 rounded-2xl border border-border bg-surface2/70 p-4 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 resize-vertical"
              placeholder="How can we help?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <p className="text-xs text-muted">We’ll use your email only to reply. No spam.</p>

            <button
              type="submit"
              disabled={sending || !email.trim() || !message.trim()}
              className="btn-accent w-full h-12 rounded-full text-base disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send message"}
            </button>
          </form>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-accent text-black px-5 py-2 text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
