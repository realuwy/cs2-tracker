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

  // load session + guest flag each time it opens
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

  // focus trap + scroll lock + Esc
  useEffect(() => {
    if (!open) return;

    const root = ref.current!;
    const focusables = root.querySelectorAll<HTMLElement>(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || focusables.length === 0) return;
      if (document.activeElement === last && !e.shiftKey) {
        e.preventDefault();
        (first as HTMLElement)?.focus();
      }
      if (document.activeElement === first && e.shiftKey) {
        e.preventDefault();
        (last as HTMLElement)?.focus();
      }
    };

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    first?.focus();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const onChangePassword = async () => {
    if (!userEmail) {
      setMessage("Sign in to change your password.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: typeof window !== "undefined" ? `${location.origin}/reset` : undefined,
      });
      if (error) throw error;
      setMessage("Check your inbox — password reset link sent.");
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
      setMessage("Local data cleared on this device.");
      setConfirmingClear(false);
    } catch {
      setMessage("Could not clear local data.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onMouseDown={onOverlayClick}
      data-ui="settings-v2"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        className="
          w-full max-w-md rounded-2xl border border-border
          bg-surface p-7 text-text shadow-[0_10px_30px_rgba(0,0,0,0.35)]
          opacity-0 scale-95 data-[show=true]:opacity-100 data-[show=true]:scale-100
          transition duration-150 ease-out
        "
        data-show="true"
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-[28px] font-extrabold leading-[1.15] tracking-tight">Settings</h2>
            <p className="mt-1 text-sm text-muted">Manage your account and local data.</p>
          </div>
          <button
            className="inline-flex items-center rounded-lg border border-border bg-surface2/70 px-2 py-1 text-sm hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Identity chip / status */}
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
            Profile
          </span>
          <span className="text-sm text-muted">
            {isGuest ? (
              <>Browsing as <span className="text-text">Guest</span></>
            ) : userEmail ? (
              <>Signed in as <span className="text-text">{userEmail}</span></>
            ) : (
              <>Not signed in</>
            )}
          </span>
        </div>

        {message && (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
            {message}
          </div>
        )}

        {/* Sections */}
        <div className="grid gap-4">
          {/* Account section */}
          <section className="rounded-xl border border-border bg-surface2/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  {/* key icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M21 10a5 5 0 10-9.9 1H3v3h3v3h3v3h3l1.06-1.06A5 5 0 0021 10zM7 14H5v-1h6.1a5.02 5.02 0 001.37 1.83L12 15h-2v-1H8v-1H7v1z" />
                  </svg>
                </div>
                <div className="text-sm font-medium">Account</div>
              </div>
              {isGuest && (
                <span className="inline-flex items-center rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                  Guest
                </span>
              )}
            </div>

            <button
              onClick={onChangePassword}
              disabled={busy || !userEmail}
              title={!userEmail ? "Sign in to change your password" : undefined}
              className="
                w-full h-11 rounded-2xl font-semibold
                bg-accent text-black hover:bg-[var(--accent-hover,#c9ff0d)]
                focus:outline-none focus:ring-2 focus:ring-accent/30
                shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_10px_26px_-12px_rgba(216,255,53,0.25)]
                disabled:opacity-60
              "
            >
              Send password reset
            </button>

            {!userEmail && (
              <p className="mt-2 text-xs text-muted">
                Tip: create an account or sign in to enable password changes.
              </p>
            )}
          </section>

          {/* Local data section */}
          <section className="rounded-xl border border-border bg-surface2/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  {/* trash icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 7h2v8h-2v-8zm-4 0h2v8H6v-8zm8 0h2v8h-2v-8z" />
                  </svg>
                </div>
                <div className="text-sm font-medium">Local data</div>
              </div>
            </div>

            {!confirmingClear ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  Clear items saved on <em>this device only</em>.
                </p>
                <button
                  className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-3 text-red-300 hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-red-400/30"
                  onClick={() => setConfirmingClear(true)}
                >
                  Clear data…
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                <p className="text-sm">
                  This removes local items and the guest flag on this device. Cloud data isn’t affected.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-border bg-surface px-3 hover:bg-surface/80 focus:outline-none focus:ring-2 focus:ring-accent/30"
                    onClick={() => setConfirmingClear(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-border bg-red-500/10 px-3 text-red-300 hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-400/30"
                    onClick={clearLocalData}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

