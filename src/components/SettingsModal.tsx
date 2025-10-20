"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

type Props = { open: boolean; onClose: () => void };

export default function SettingsModal({ open, onClose }: Props) {
  const supabase = getSupabaseClient();
  const ref = useRef<HTMLDivElement>(null);

  const [confirmingClear, setConfirmingClear] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMessage(null);
    setConfirmingClear(false);
    (async () => {
      const { data } = await supabase.auth.getSession();
      setUserEmail(data.session?.user?.email ?? null);
      setIsGuest(
        typeof window !== "undefined" &&
          window.localStorage.getItem("guest_mode") === "true"
      );
    })();
  }, [open, supabase]);

  // focus trap + scroll lock
  useEffect(() => {
    if (!open) return;
    const root = ref.current!;
    const els =
      root.querySelectorAll<HTMLElement>(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
      ) || [];
    const first = els[0];
    const last = els[els.length - 1];

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); (last as HTMLElement)?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); (first as HTMLElement)?.focus();
      }
    };

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    first?.focus();

    window.addEventListener("keydown", trap);
    return () => {
      window.removeEventListener("keydown", trap);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const onChangePassword = async () => {
    if (!userEmail) {
      setMessage("You need to be signed in to change your password.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: typeof window !== "undefined" ? `${location.origin}/reset` : undefined,
      });
      if (error) throw error;
      setMessage("Check your inbox—password reset link sent.");
    } catch (e: any) {
      setMessage(e?.message ?? "Could not start reset.");
    } finally {
      setBusy(false);
    }
  };

  const clearLocalData = () => {
    try {
      localStorage.removeItem("portfolio_items");
      localStorage.removeItem("guest_mode");
      setMessage("Local data cleared.");
      setConfirmingClear(false);
    } catch {
      setMessage("Could not clear local data.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div ref={ref} className="modal w-full max-w-md p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[22px] font-bold tracking-tight">Settings</h2>
          <button className="btn-ghost px-2 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
            {message}
          </div>
        )}

        <div className="grid gap-4">
          <div className="card p-4">
            <div className="mb-2 text-sm text-muted">
              Change password {isGuest && "(sign in required)"}
            </div>
            <button
              className="btn-accent h-11 w-full rounded-2xl"
              onClick={onChangePassword}
              disabled={busy || !userEmail}
              title={!userEmail ? "Sign in to change your password" : undefined}
            >
              Send reset email
            </button>
          </div>

          <div className="card p-4">
            {!confirmingClear ? (
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted">
                  Clear local data (guest items on this device)
                </div>
                <button
                  className="btn-danger h-10 rounded-lg px-3"
                  onClick={() => setConfirmingClear(true)}
                >
                  Clear data…
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="text-sm">
                  This will remove local items on <em>this device only</em>. Your
                  cloud data won’t be affected.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn-ghost h-10 flex-1 rounded-lg"
                    onClick={() => setConfirmingClear(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-danger h-10 flex-1 rounded-lg"
                    onClick={clearLocalData}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
