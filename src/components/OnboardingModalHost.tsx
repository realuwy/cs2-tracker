// src/components/OnboardingModalHost.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { generateUserId, setUserId } from "@/lib/id";

type Tab = "create" | "paste" | "recover";
const ENABLE_RECOVERY = process.env.NEXT_PUBLIC_ENABLE_RECOVERY === "true";
const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export default function OnboardingModalHost() {
  const sp = useSearchParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("create");
  const [email, setEmail] = useState("");
  const [pasteId, setPasteId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // open via ?onboard=1 or via custom event
  useEffect(() => {
    if (sp.get("onboard") === "1") setOpen(true);
    const onOpen = (e: Event) => {
      setOpen(true);
      const d = (e as CustomEvent<{ tab?: Tab }>).detail;
      if (d?.tab) setTab(d.tab);
    };
    const onClose = () => setOpen(false);
    window.addEventListener("onboard:open", onOpen as EventListener);
    window.addEventListener("onboard:close", onClose);
    return () => {
      window.removeEventListener("onboard:open", onOpen as EventListener);
      window.removeEventListener("onboard:close", onClose);
    };
  }, [sp]);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    const u = new URL(window.location.href);
    u.searchParams.delete("onboard");
    router.replace(u.pathname + u.search);
  };

  async function createId() {
    setBusy(true);
    setMsg("");

    const id = generateUserId();
    setUserId(id);

    let info = "Your ID was created.";
    const em = email.trim();
    if (em) {
      try {
        const res = await fetch("/api/register-id", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: em, userId: id }),
        });
        if (res.status === 409) {
          info = "That email is already linked to an ID. Use Recover to retrieve it.";
        }
      } catch {
        info = "ID created locally. Couldn’t link email right now.";
      }
    }

    setMsg(info);
    setBusy(false);
    setTimeout(() => {
      close();
      router.push("/dashboard");
    }, 200);
  }

  function savePastedId() {
    const id = pasteId.trim();
    if (!isUuid(id)) {
      setMsg("Please paste a valid UUID v4.");
      return;
    }
    setUserId(id);
    close();
    router.push("/dashboard");
  }

  async function recover() {
    setBusy(true);
    setMsg("");
    try {
      await fetch("/api/recover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setMsg("If an ID is linked to that email, you’ll receive it shortly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Create your CS2 Tracker ID</h2>
          <button
            onClick={close}
            className="rounded-lg border border-border px-2 py-1 hover:bg-surface2/70"
          >
            ✕
          </button>
        </div>

        <div
          className="mb-4 grid gap-2 text-sm"
          style={{ gridTemplateColumns: ENABLE_RECOVERY ? "repeat(3,1fr)" : "repeat(2,1fr)" }}
        >
          <button
            className={tab === "create" ? "btn-accent" : "btn-muted"}
            onClick={() => setTab("create")}
          >
            Create ID
          </button>
          <button
            className={tab === "paste" ? "btn-accent" : "btn-muted"}
            onClick={() => setTab("paste")}
          >
            I have an ID
          </button>
          {ENABLE_RECOVERY && (
            <button
              className={tab === "recover" ? "btn-accent" : "btn-muted"}
              onClick={() => setTab("recover")}
            >
              Recover
            </button>
          )}
        </div>

        {tab === "create" && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              We’ll generate a private ID and save it on this device. Add an email (optional) to
              recover later.
            </p>
            <input
              className="w-full rounded-lg border border-border bg-surface2/70 px-3 py-2"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <button onClick={createId} disabled={busy} className="w-full btn-accent">
              {busy ? "Creating…" : "Create ID"}
            </button>
          </div>
        )}

        {tab === "paste" && (
          <div className="space-y-3">
            <input
              className="w-full rounded-lg border border-border bg-surface2/70 px-3 py-2"
              placeholder="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
              value={pasteId}
              onChange={(e) => setPasteId(e.target.value)}
              disabled={busy}
            />
            <button onClick={savePastedId} disabled={busy} className="w-full btn-accent">
              Save
            </button>
          </div>
        )}

        {ENABLE_RECOVERY && tab === "recover" && (
          <div className="space-y-3">
            <input
              className="w-full rounded-lg border border-border bg-surface2/70 px-3 py-2"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <button onClick={recover} disabled={busy} className="w-full btn-accent">
              {busy ? "Sending…" : "Send my ID"}
            </button>
          </div>
        )}

        {msg && <p className="mt-4 text-sm text-amber-400">{msg}</p>}
      </div>
    </div>
  );
}
