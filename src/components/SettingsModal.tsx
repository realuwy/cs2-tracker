// src/components/SettingsModal.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAllLocalData, getUserId } from "@/lib/id";

type Props = {
  open: boolean;
  onClose: () => void;
};

const EMAIL_KEY = "cs2:email";

export default function SettingsModal({ open, onClose }: Props) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getUserId());
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(EMAIL_KEY);
      setLinkedEmail(saved && saved.trim() ? saved : null);
      if (!email && saved) setEmail(saved);
    }
  }, [open]);

  if (!open) return null;

  async function linkEmail() {
    if (!userId) {
      setErr("Create or paste an ID first.");
      return;
    }
    const e = email.trim().toLowerCase();
    if (!e || !/^\S+@\S+\.\S+$/.test(e)) {
      setErr("Enter a valid email.");
      return;
    }

    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/register-id", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: e, userId }),
      });

      if (res.status === 409) {
        // Email already linked to a different ID (or duplicate per your API)
        setErr("That email is already linked to another ID.");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to link email.");
      }

      // Save locally for quick status display
      if (typeof window !== "undefined") {
        window.localStorage.setItem(EMAIL_KEY, e);
      }
      setLinkedEmail(e);
      setMsg("Email linked successfully.");
    } catch (e: any) {
      setErr(e?.message || "Failed to link email.");
    } finally {
      setBusy(false);
    }
  }

  function unlinkEmailLocalOnly() {
    // Optional: you could add a server-side "unlink" endpoint in future.
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(EMAIL_KEY);
    }
    setLinkedEmail(null);
    setMsg("Email unlinked locally.");
  }

  function recoverByEmail() {
    window.dispatchEvent(
      new CustomEvent("onboard:open", { detail: { tab: "recover" } })
    );
    onClose();
  }

  function copyId() {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setMsg("ID copied to clipboard.");
  }

  async function exportData() {
    try {
      const raw = localStorage.getItem("cs2:dashboard:rows") ?? "[]";
      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cs2tracker-portfolio.json";
      a.click();
      URL.revokeObjectURL(url);
      setMsg("Exported portfolio JSON.");
    } catch {
      setErr("Failed to export data.");
    }
  }

  async function importData(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      // naive validation — ensure it's an array
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Invalid file.");
      localStorage.setItem("cs2:dashboard:rows", JSON.stringify(parsed));
      localStorage.setItem("cs2:dashboard:rows:updatedAt", String(Date.now()));
      setMsg("Imported portfolio JSON.");
      // trigger UI to refresh if needed
      router.refresh?.();
    } catch (e: any) {
      setErr(e?.message || "Failed to import data.");
    } finally {
      // reset input so same file can be re-picked
      ev.currentTarget.value = "";
    }
  }

  function resetAll() {
    clearAllLocalData();
    setLinkedEmail(null);
    setMsg("Local data cleared.");
    router.push("/");
    window.dispatchEvent(new CustomEvent("onboard:open", { detail: { tab: "create" } }));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-card">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            className="rounded-lg border border-border bg-surface2/70 px-2 py-1 hover:bg-surface"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* ID */}
        <div className="mt-4 rounded-xl border border-border bg-surface2/60 p-4">
          <div className="text-sm text-muted">Your ID</div>
          <div className="mt-1 font-mono break-all text-sm text-text">
            {userId ?? "No ID on this device"}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              className="rounded-lg border border-border bg-surface px-3 py-1 text-sm hover:bg-surface/60 disabled:opacity-50"
              onClick={copyId}
              disabled={!userId}
            >
              Copy ID
            </button>
            <button
              className="rounded-lg border border-border bg-surface px-3 py-1 text-sm hover:bg-surface/60"
              onClick={recoverByEmail}
            >
              Recover by Email
            </button>
          </div>
        </div>

        {/* Email link/unlink */}
        <div className="mt-4 rounded-xl border border-border bg-surface2/60 p-4">
          <div className="text-sm text-muted">Email (for recovery only)</div>
          {linkedEmail ? (
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm">
                Linked: <span className="text-text">{linkedEmail}</span>
              </div>
              <button
                className="rounded-lg border border-border bg-surface px-3 py-1 text-sm hover:bg-surface/60"
                onClick={unlinkEmailLocalOnly}
              >
                Unlink (local)
              </button>
            </div>
          ) : (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                className="btn-accent px-4 py-2 text-sm disabled:opacity-50"
                disabled={busy}
                onClick={linkEmail}
              >
                {busy ? "Linking…" : "Link Email"}
              </button>
            </div>
          )}
          <p className="mt-2 text-xs text-muted">
            We only store an email → ID mapping on the server. Your inventory remains local.
          </p>
        </div>

        {/* Data controls */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface2/60 p-4">
            <div className="text-sm font-medium">Export / Import</div>
            <div className="mt-2 flex items-center gap-2">
              <button
                className="rounded-lg border border-border bg-surface px-3 py-1 text-sm hover:bg-surface/60"
                onClick={exportData}
              >
                Export JSON
              </button>
              <label className="rounded-lg border border-border bg-surface px-3 py-1 text-sm hover:bg-surface/60 cursor-pointer">
                Import JSON
                <input
                  type="file"
                  accept="application/json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface2/60 p-4">
            <div className="text-sm font-medium">Danger</div>
            <button
              className="mt-2 w-full rounded-lg border border-red-400/50 bg-red-400/10 px-3 py-2 text-sm text-red-300 hover:bg-red-400/15"
              onClick={resetAll}
            >
              Reset local data
            </button>
          </div>
        </div>

        {/* Messages */}
        {(msg || err) && (
          <div className="mt-4 rounded-lg border border-border bg-surface2/60 p-3 text-sm">
            {msg && <div className="text-emerald-300">{msg}</div>}
            {err && <div className="text-red-300">{err}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

