// src/components/OnboardingModalHost.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { generateUserId, setUserId } from "@/lib/id";

function isUuidV4(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export default function OnboardingModalHost() {
  const sp = useSearchParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"create" | "paste" | "recover">("create");
  const [email, setEmail] = useState("");
  const [pasteId, setPasteId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // open via ?onboard=1 or event
  useEffect(() => {
    if (sp.get("onboard") === "1") setOpen(true);
  }, [sp]);
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener("onboard:open", onOpen);
    window.addEventListener("onboard:close", onClose);
    return () => {
      window.removeEventListener("onboard:open", onOpen);
      window.removeEventListener("onboard:close", onClose);
    };
  }, []);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("onboard");
    router.replace(url.pathname + (url.search ? `?${url.searchParams}` : ""));
  };

  async function createId() {
    setBusy(true); setMsg("");
    try {
      const id = generateUserId();
      setUserId(id);
      if (email.trim()) {
        await fetch("/api/register-id", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, userId: id }),
        }).catch(() => {});
      }
      setMsg("Your ID was created on this device.");
      setTimeout(() => { close(); router.push("/dashboard"); }, 300);
    } finally { setBusy(false); }
  }

  function savePastedId() {
    setMsg("");
    const id = pasteId.trim();
    if (!isUuidV4(id)) { setMsg("Please paste a valid UUID v4."); return; }
    setUserId(id);
    close();
    router.push("/dashboard");
  }

  async function recoverByEmail() {
    setBusy(true); setMsg("");
    try {
      await fetch("/api/recover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setMsg("If an ID is linked to that email, you’ll receive it shortly.");
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Create your CS2 Tracker ID</h2>
          <button onClick={close} className="rounded-lg border border-border px-2 py-1 hover:bg-surface2/70">✕</button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
          <button className={tab === "create" ? "btn-accent" : "btn-muted"} onClick={() => setTab("create")}>Create ID</button>
          <button className={tab === "paste" ? "btn-accent" : "btn-muted"} onClick={() => setTab("paste")}>I have an ID</button>
          <button className={tab === "recover" ? "btn-accent" : "btn-muted"} onClick={() => setTab("recover")}>Recover</button>
        </div>

        {tab === "create" && (
          <div className="space-y-3">
            <p className="text-sm text-muted">We’ll generate a private ID and save it on this device. Optional email lets you recover later.</p>
            <label className="block text-sm">
              <span className="mb-1 block opacity-80">Recovery email (optional)</span>
              <input
                className="w-full rounded-lg border border-border bg-surface2/70 px-3 py-2 outline-none focus:border-accent"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </label>
            <button onClick={createId} disabled={busy} className="w-full btn-accent">
              {busy ? "Creating…" : "Create ID"}
            </button>
          </div>
        )}

        {tab === "paste" && (
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block opacity-80">Paste your ID</span>
              <input
                className="w-full rounded-lg border border-border bg-surface2/70 px-3 py-2 outline-none focus:border-accent"
                placeholder="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
                value={pasteId}
                onChange={(e) => setPasteId(e.target.value)}
                disabled={busy}
              />
            </label>
            <button onClick={savePastedId} disabled={busy} className="w-full btn-accent">Save</button>
          </div>
        )}

        {tab === "recover" && (
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block opacity-80">Email</span>
              <input
                className="w-full rounded-lg border border-border bg-surface2/70 px-3 py-2 outline-none focus:border-accent"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </label>
            <button onClick={recoverByEmail} disabled={busy} className="w-full btn-accent">
              {busy ? "Sending…" : "Send my ID"}
            </button>
          </div>
        )}

        {msg && <p className="mt-4 text-sm text-amber-400">{msg}</p>}
      </div>
    </div>
  );
}

