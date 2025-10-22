"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ContactModalHost() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const search = useSearchParams();

  // Open from URL (?contact=1) or window event: window.dispatchEvent(new Event("contact:open"))
  useEffect(() => {
    if (search.get("contact")) {
      setOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("contact");
      window.history.replaceState({}, "", url.toString());
    }
  }, [search]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("contact:open", onOpen);
    return () => window.removeEventListener("contact:open", onOpen);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onSend = async () => {
    if (!message.trim()) return;
    setSending(true);

    // Compose email to your Proton address
    const to = "cs2-tracker@proton.me";
    const subject = encodeURIComponent("CS2 Tracker – Contact");
    const body = encodeURIComponent(
      [
        `From: ${username || "(anonymous)"}`,
        `Email: ${email || "(not provided)"}`,
        "",
        "Message:",
        message.trim(),
      ].join("\n")
    );

    // Best-effort: open mail client; keep the modal open so they can copy if needed
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, "_blank");

    setSending(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 text-text shadow-card">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight">Contact</h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg border border-border bg-surface2/70 px-2 py-1 text-sm hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            Close
          </button>
        </div>

        {/* Subhead */}
        <p className="mb-5 text-sm text-muted">
          Send us a note. Include your email if you’d like a reply.
        </p>

        {/* Form – single column for consistency with Auth */}
        <div className="space-y-4">
          <label className="block">
            <span className="label">Username (optional)</span>
            <input
              className="input"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="label">Email (optional)</span>
            <input
              className="input"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="label">Message</span>
            <textarea
              className="input h-32 resize-none"
              placeholder="How can we help?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>

          <button
            onClick={onSend}
            disabled={sending || !message.trim()}
            className="btn-accent w-full h-12 rounded-full text-base disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send message"}
          </button>

          <p className="mt-1 text-center text-xs text-muted">
            We’ll use your email only to reply. No spam.
          </p>
        </div>
      </div>
    </div>
  );
}
