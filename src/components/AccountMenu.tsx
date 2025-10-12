"use client";

import { useState, useRef, useEffect } from "react";

type UserLite = { name?: string | null; email?: string | null; avatarUrl?: string | null } | null;

export default function AccountMenu({
  user,
  onOpenAuth,
  onClearLocal,
}: {
  user: UserLite;
  onOpenAuth: () => void;
  onClearLocal: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const initial =
    (user?.name?.trim() || user?.email?.trim() || "A").slice(0, 1).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text/85 hover:bg-surface2"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-bg">
          {initial}
        </span>
        <span className="hidden sm:inline">{user ? "Account" : "Account"}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          className={`transition ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          {user ? (
            <>
              <div className="px-3 py-2 text-xs text-muted">
                {user.name || user.email}
              </div>
              <div className="h-px bg-border/60" />
              <button
                onClick={() => {
                  setOpen(false);
                  void onClearLocal();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-text/90 hover:bg-surface2"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenAuth();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-text/90 hover:bg-surface2"
              >
                Sign in / Sign up
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
