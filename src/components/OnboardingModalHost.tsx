// src/components/OnboardingModalHost.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { generateUserId, getUserId, setUserId } from "@/lib/id";

export default function OnboardingModalHost() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"intro" | "show">("intro");
  const [email, setEmail] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const search = useSearchParams();
  const initialised = useRef(false);

  // open via dispatchEvent: window.dispatchEvent(new Event("onboard:open"))
  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setStep("intro");
    };
    window.addEventListener("onboard:open", onOpen);
    return () => window.removeEventListener("onboard:open", onOpen);
  }, []);

  // optional URL trigger: /?start=1
  useEffect(() => {
    if (search.get("start") === "1") {
      setOpen(true);
      setStep("intro");
      const url = new URL(window.location.href);
      url.searchParams.delete("start");
      window.history.replaceState({}, "", url.toString());
    }
  }, [search]);

  // first-time hint: if no ID, clicking Get Started will open; otherwise do nothing
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    const existing = getUserId();
    if (!existing) {
      // do nothing automatically; user clicks CTA to open
    }
  }, []);

  function createIdAndAdvance(e?: React.FormEvent) {
    e?.preventDefault();
    const newId = generateUserId();
    setUserId(newId);
    setId(newId);
    setStep("show");
  }

  function copyId() {
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function goDashboard() {
    setOpen(false);
    router.push("/dashboard");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-7 shadow-card text-text">
        {/* header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[28px] leading-none font-extrabold tracking-tight">
              {step === "intro" ? "Get your CS2 Tracker ID" : "Your ID is ready"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              Your ID is your private key for loading your dashboard on any device.
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="mt-1 rounded-lg border border-border bg-surface2/70 px-2 py-1 text-sm hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            Close
          </button>
        </div>

        {step === "intro" && (
          <form onSubmit={createIdAndAdvance} className="mt-6 space-y-4">
            <div className="rounded-xl border border-border bg-surface2/70 p-4">
              <p className="text-sm">
                We’ll generate a unique ID and store it in your browser. Keep it safe —
                it unlocks your items on any device. You can optionally add your email
                (for future recovery features). Your email is only used to link to your ID.
              </p>
            </div>

            <div>
              <label className="label">Email (optional for future recovery)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <button type="submit" className="btn-accent w-full h-12 rounded-full text-base">
              Generate my ID
            </button>

            <p className="text-xs text-muted text-center">
              We don’t store your dashboard on a server. Your ID keeps your data portable.
            </p>
          </form>
        )}

        {step === "show" && (
          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-border bg-surface2/70 p-4">
              <div className="text-xs uppercase tracking-wider text-muted">Your ID</div>
              <div className="mt-1 select-all rounded-lg bg-bg px-3 py-2 font-mono text-sm">
                {id}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={copyId} className="btn-ghost">
                  {copied ? "Copied!" : "Copy ID"}
                </button>
                <button
                  onClick={goDashboard}
                  className="btn-accent"
                >
                  Continue to Dashboard
                </button>
              </div>
            </div>

            <p className="text-xs text-muted">
              Tip: paste this ID on another device to load your items there.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
