"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const CONTACT_EMAIL = "cs2-tracker@proton.me";

export default function ContactModalHost() {
  const search = useSearchParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  // Open via URL param: /?contact=1  (also accepts contact=open, contact=true)
  useEffect(() => {
    const flag = search.get("contact");
    if (flag && ["1", "true", "open"].includes(flag.toLowerCase())) {
      setOpen(true);
      // clean the address bar so refresh doesn’t re-open
      const url = new URL(window.location.href);
      url.searchParams.delete("contact");
      window.history.replaceState({}, "", url.toString());
    }
  }, [search]);

  // Open via global event: window.dispatchEvent(new Event("contact:open"))
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

  if (!open) return null;

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple: mailto draft. (Swap to API later if you want server-side email.)
    const subject = encodeURIComponent("[CS2 Tracker] Contact");
    const body = encodeURIComponent(
      `Username: ${username || "(not provided)"}\nEmail: ${email || "(not provided)"}\n\n${message}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setOpen(false);
    setUsername("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="modal max-w-xl w-[92%] sm:w-[520px]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Contact</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-ghost px-2 py-1 text-sm"
          >
            Close
          </button>
        </div>

        <form onSubmit={send} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Username (optional)</label>
              <input
                className="input"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Email (optional)</label>
              <input
                className="input"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Message</label>
            <textarea
              className="input h-36 resize-none"
              placeholder="How can we help?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-accent w-full py-3 text-base">
            Send message
          </button>

          <p className="mt-2 text-center text-xs text-muted">
            We’ll use your email only to reply. No spam.
          </p>
        </form>
      </div>
    </div>
  );
}
