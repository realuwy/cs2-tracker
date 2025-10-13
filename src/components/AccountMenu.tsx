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

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const initial =
    (user?.name?.trim() || user?.email?.trim() || "A").slice(0, 1).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-800/60 bg-[#0b0b0f]/60 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[13px] font-semibold text-white">
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
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-800/60 bg-[#0b0b0f]/95 shadow-2xl backdrop-blur"
        >
          {user ? (
            <>
              <div className="px-3 py-2 text-xs text-slate-400">
                {user.name || user.email}
              </div>
              <div className="h-px bg-slate-800/60" />
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  void onClearLocal();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800/60"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onOpenAuth();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800/60"
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
