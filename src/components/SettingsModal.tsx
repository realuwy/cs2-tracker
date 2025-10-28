// src/components/SettingsModal.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAllLocalData } from "@/lib/id"; // keep if you still want the "clear data" action

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SettingsModal({ open, onClose }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data: { email: string | null } = await res.json();
        setEmail(data?.email ?? null);
      } catch {
        setEmail(null);
      }
    })();
  }, [open]);

  if (!open) return null;

  async function resendCode() {
    setLoading(true);
    try {
      await fetch("/api/auth/resend", { method: "POST" });
      // keep it simple; you can swap to a toast later
      alert("Verification email sent. Check your inbox.");
    } catch {
      alert("Could not send email. Try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setEmail(null);
      onClose();
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function clearLocal() {
    clearAllLocalData();
    alert("Local data cleared.");
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Account & Settings</h2>
          <button
            className="rounded-lg border border-border px-2 py-1 text-sm hover:bg-surface2/70"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-surface2/50 p-3">
            <div className="mb-1 text-xs uppercase tracking-wide text-muted">Status</div>
            <div className="text-sm">
              {email ? (
                <>
                  Signed in as{" "}
                  <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px]">
                    {email}
                  </span>
                </>
              ) : (
                "Not signed in"
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface2/50 p-3">
            <div className="mb-2 text-xs uppercase tracking-wide text-muted">Email</div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={resendCode}
                disabled={loading}
                className="rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-surface/70 disabled:opacity-60"
              >
                Resend verification email
              </button>

              {email && (
                <button
                  type="button"
                  onClick={signOut}
                  disabled={loading}
                  className="rounded-lg border border-border px-3 py-2 text-left text-sm text-red-300 hover:bg-red-400/10 disabled:opacity-60"
                >
                  Sign out
                </button>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface2/50 p-3">
            <div className="mb-2 text-xs uppercase tracking-wide text-muted">Data</div>
            <button
              type="button"
              onClick={clearLocal}
              className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-surface/70"
            >
              Clear local data
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
