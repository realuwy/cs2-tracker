"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

function MenuItem({
  children,
  onClick,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const base =
    "w-full px-3 py-2 text-left text-sm rounded-md hover:bg-surface2/70 transition";
  if (href) {
    return (
      <Link href={href} className={base} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={base} onClick={onClick}>
      {children}
    </button>
  );
}

export default function AccountMenu({ authed }: { authed: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Close on outside click / Esc
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative hidden md:block" ref={ref}>
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(v => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-text hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        Account
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M7 10l5 5 5-5H7z" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-surface/95 p-2 shadow-lg backdrop-blur"
        >
          {/* Show different sets depending on auth */}
          {authed ? (
            <>
              <div className="px-2 pb-1 text-[11px] uppercase tracking-wide text-muted">Account</div>
              <MenuItem href="/dashboard" onClick={() => setIsOpen(false)}>
                Dashboard
              </MenuItem>
              <MenuItem
                onClick={async () => {
                  setIsOpen(false);
                  const supabase = getSupabaseClient();
                  await supabase.auth.signOut();
                  router.push("/login");
                  router.refresh();
                }}
              >
                Sign Out
              </MenuItem>
            </>
          ) : (
            <>
              <div className="px-2 pb-1 text-[11px] uppercase tracking-wide text-muted">Get started</div>
              <MenuItem href="/login" onClick={() => setIsOpen(false)}>
                Sign In
              </MenuItem>
              <MenuItem href="/login" onClick={() => setIsOpen(false)}>
                Sign Up
              </MenuItem>
              <MenuItem
                onClick={() => {
                  try {
                    localStorage.setItem("cs2:guest", "1"); // guest mode flag
                  } catch {}
                  setIsOpen(false);
                  router.push("/dashboard");
                }}
              >
                Continue as guest
              </MenuItem>
            </>
          )}
        </div>
      )}
    </div>
  );
}
