"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

type Mode = "closed" | "form" | "sent";
type SubmitState = "idle" | "sending" | "done" | "error";

export default function ContactModalHost() {
  const supabase = getSupabaseClient();

  const [open, setOpen] = useState<Mode>("closed");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [err, setErr] = useState<string | null>(null);

  // Open via window event
  useEffect(() => {
    const onOpen = () => {
      setUsername("");
      setEmail("");
      setMessage("");
      setErr(null);
      setStatus("idle");
      setOpen("form");
    };
    window.addEventListener("contact:open", onOpen);
    return () => window.removeEventListener("contact:open", onOpen);
  }, []);

  // Open via /?contact=1
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("contact") === "1") {
      url.searchParams.delete("contact");
      window.history.replaceState({}, "", url.toString());
      setOpen("form");
    }
  }, []);

  const close = () => setOpen("closed");

  const submit = async () => {
    if (!message.trim()) {
      setErr("Please write a short message.");
      return;
    }
    setStatus("sending");
    setErr(null);

    try {
      const sess = await supabase.auth.getSession();
      const userId = sess.data.session?.user?.id ?? null;

      const { error } = await supabase.from("contact_messages").insert({
        user_id: userId,
        username: username || null,
        email: email || null,
        message,
      });
      if (error) throw error;

      setStatus("done");
      setOpen("sent");
    } catch {
      // Fallback to mailto so users can still reach you
      try {
        const subject = encodeURIComponent("CS2 Tracker — Contact");
        const body = encodeURIComponent(
          `Username: ${username || "-"}\nEmail: ${email || "-"}\n\nMessage:\n${message}`
        );
        window.location.href = `mailto:cs2-tracker@proton.me?subject=${subject}&body=${body}`;
        setStatus("done");
        setOpen("sent");
      } catch {
        setStatus("error");
        setErr("Could not send right now. Please try again later.");
      }
    }
  };

  if (open === "closed") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="modal w-full max-w-lg">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold">Contact</h2>
            <p className="mt-1 text-sm text-muted">
              We usually reply within 1–2 days.
            </p>
          </div>
          <button
            onClick={close}
            className="rounded-md border border-border px-2 py-1 text-sm hover:bg-surface2/70"
          >
            Close
          </button>
        </div>

        {open === "form" && (
          <>
            {err && (
              <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {err}
              </div>
            )}

            {/* Single column like the auth modal; username/email side-by-side on sm+ */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="sr-only">Username (optional)</label>
                  <input
                    className="w-full h-12 rounded-full border border-border bg-surface2/70 px-5 text-sm text-text outline-none focus:ring-2 focus:ring-accent/30"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username (optional)"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="sr-only">Email (optional)</label>
                  <input
                    className="w-full h-12 rounded-full border border-border bg-surface2/70 px-5 text-sm text-text outline-none focus:ring-2 focus:ring-accent/30"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional)"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="sr-only">Message</label>
                <textarea
                  className="w-full min-h-[140px] rounded-2xl border border-border bg-surface2/70 px-4 py-3 text-sm text-text outline-none focus:ring-2 focus:ring-accent/30"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                />
              </div>

              <button
                className="btn-accent w-full h-12 rounded-full text-base"
                disabled={status === "sending"}
                onClick={submit}
              >
                {status === "sending" ? "Sending…" : "Send message"}
              </button>

              <p className="text-center text-xs text-muted">
                We’ll use your email only to reply. No spam.
              </p>
            </div>
          </>
        )}

        {open === "sent" && (
          <div className="text-center">
            <p className="text-sm text-muted">Thanks! Your message has been sent.</p>
            <button className="btn-ghost mt-4 w-full h-11 rounded-full" onClick={close}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
