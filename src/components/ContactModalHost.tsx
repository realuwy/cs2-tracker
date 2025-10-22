"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ContactModalHost() {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const search = useSearchParams();

  // open via `?contact=1`
  useEffect(() => {
    if (search.get("contact")) {
      setOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("contact");
      window.history.replaceState({}, "", url.toString());
    }
  }, [search]);

  // open via `window.dispatchEvent(new Event("contact:open"))`
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("contact:open", onOpen);
    return () => window.removeEventListener("contact:open", onOpen);
  }, []);

  // esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onSend = () => {
    if (!message.trim()) return;
    setSending(true);

    const to = "cs2-tracker@proton.me";
    const subject = encodeURIComponent("CS2 Tracker – Contact");
    const body = encodeURIComponent(
      [
        `Name: ${fullName || "(anonymous)"}`,
        `Email: ${email || "(not provided)"}`,
        "",
        "Message:",
        message.trim(),
      ].join("\n")
    );

    // open mail client (no backend required, same behavior as before)
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, "_blank");
    setSending(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-7 shadow-card text-text">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[28px] leading-none font-extrabold tracking-tight">
              Let’s talk
            </h2>
            <p className="mt-2 text-sm text-muted">
              Tell us what’s up. Leave an email if you’d like a reply.
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="mt-1 rounded-lg border border-border bg-surface2/70 px-2 py-1 text-sm hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            Close
          </button>
        </div>

        {/* Form – same “pill” feel as auth modal */}
        <div className="mt-6 space-y-4">
          <input
            aria-label="Full name (optional)"
            className="w-full h-12 rounded-full border border-border bg-surface2/70 px-5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Full name (optional)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <input
            type="email"
            aria-label="Email (optional)"
            className="w-full h-12 rounded-full border border-border bg-surface2/70 px-5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Enter your email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <textarea
              aria-label="Message"
              className="w-full min-height-[140px] h-36 rounded-2xl border border-border bg-surface2/70 p-4 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 resize-vertical"
              placeholder="How can we help?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button
            onClick={onSend}
            disabled={sending || !message.trim()}
            className="btn-accent w-full h-12 rounded-full text-base disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send message"}
          </button>

          <p className="text-center text-xs text-muted">
            We’ll use your email only to reply. No spam.
          </p>
        </div>
      </div>
    </div>
  );
}
