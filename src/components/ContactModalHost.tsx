"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ContactModalHost() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(false);

  const search = useSearchParams();

  // open via ?contact=1
  useEffect(() => {
    if (search.get("contact")) {
      setOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("contact");
      window.history.replaceState({}, "", url.toString());
    }
  }, [search]);

  // open via global event
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
    if (!message.trim() || !email.trim()) return;
    setSending(true);

    const to = "cs2-tracker@proton.me";
    const subject = encodeURIComponent("CS2 Tracker – Contact");
    const body = encodeURIComponent(
      [
        `Username: ${username || "(not provided)"}`,
        `Email: ${email}`,
        "",
        "Message:",
        message.trim(),
      ].join("\n")
    );

    // open mail client
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, "_blank");

    // show toast
    setToast(true);
    setSending(false);
    setMessage("");
    setTimeout(() => setToast(false), 3000);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-7 shadow-card text-text">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[28px] leading-none font-extrabold tracking-tight">
                Let’s talk
              </h2>
              <p className="mt-2 text-sm text-muted">
                Tell us what’s up. We’ll reply via your email.
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
          <div className="mt-6 space-y-4">
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
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <textarea
              aria-label="Message"
              className="w-full h-36 rounded-2xl border border-border bg-surface2/70 p-4 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 resize-vertical"
              placeholder="How can we help?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button
              onClick={onSend}
              disabled={sending || !message.trim() || !email.trim()}
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

      {/* ✅ Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-fade-in rounded-full bg-accent text-black px-5 py-2 text-sm font-medium shadow-lg">
          Message ready to send ✉️
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          85% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
        }
        .animate-fade-in {
          animation: fade-in 3s ease forwards;
        }
      `}</style>
    </>
  );
}
