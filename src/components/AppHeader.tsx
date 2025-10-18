"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

/* ---------- small atoms ---------- */

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-text/90 transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded"
    >
      {children}
    </Link>
  );
}

function MenuItem({
  children,
  onClick,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const cls =
    "w-full px-3 py-2 text-left text-sm rounded-md hover:bg-surface2/70 transition";
  if (href) {
    return (
      <Link href={href} className={cls} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick}>
      {children}
    </button>
  );
}

function DotsIcon({ className = "h-4 w-4" }) {
  // 2×2 dots; fill inherits from text color for proper contrast
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <circle cx="9" cy="9" r="2" />
      <circle cx="15" cy="9" r="2" />
      <circle cx="9" cy="15" r="2" />
      <circle cx="15" cy="15" r="2" />
    </svg>
  );
}

/* ---------- Menus ---------- */

function DotsUserMenu({ authed }: { authed: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative md:hidden" ref={ref}>
      <button
        type="button"
        aria-label="User menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        <DotsIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-surface/95 p-2 shadow-lg backdrop-blur"
        >
          <div className="px-2 pb-1 text-[11px] uppercase tracking-wide text-muted">Navigation</div>
          <MenuItem href="/" onClick={() => setOpen(false)}>
            Home
          </MenuItem>
          <MenuItem href="/dashboard" onClick={() => setOpen(false)}>
            Dashboard
          </MenuItem>
          <MenuItem href="/about" onClick={() => setOpen(false)}>
            About
          </MenuItem>
          <MenuItem href="/privacy" onClick={() => setOpen(false)}>
            Privacy
          </MenuItem>

          <div className="my-2 h-px bg-border/60" />

          {authed ? (
            <>
              <div className="px-2 pb-1 text-[11px] uppercase tracking-wide text-muted">Account</div>
              <MenuItem href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </MenuItem>
              <MenuItem
                onClick={async () => {
                  setOpen(false);
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
              <MenuItem href="/login" onClick={() => setOpen(false)}>
                Sign In
              </MenuItem>
              <MenuItem href="/login" onClick={() => setOpen(false)}>
                Sign Up
              </MenuItem>
              <MenuItem
                onClick={() => {
                  try {
                    localStorage.setItem("cs2:guest", "1");
                  } catch {}
                  setOpen(false);
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

function AccountMenu({ authed }: { authed: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
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
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-text hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        Account
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M7 10l5 5 5-5H7z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-surface/95 p-2 shadow-lg backdrop-blur"
        >
          {authed ? (
            <>
              <div className="px-2 pb-1 text-[11px] uppercase tracking-wide text-muted">Account</div>
              <MenuItem href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </MenuItem>
              <MenuItem
                onClick={async () => {
                  setOpen(false);
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
              <MenuItem href="/login" onClick={() => setOpen(false)}>
                Sign In
              </MenuItem>
              <MenuItem href="/login" onClick={() => setOpen(false)}>
                Sign Up
              </MenuItem>
              <MenuItem
                onClick={() => {
                  try {
                    localStorage.setItem("cs2:guest", "1");
                  } catch {}
                  setOpen(false);
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

/* ---------- Header ---------- */

export default function AppHeader() {
  const supabase = getSupabaseClient();
  const [authed, setAuthed] = useState<boolean>(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setAuthed(Boolean(data.session?.user?.id));
      const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
        setAuthed(Boolean(sess?.user?.id));
      });
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => unsub?.();
  }, [supabase]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Left: brand */}
        <Link
          href="/"
          aria-label="CS2 Tracker home"
          className="group inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Image
            src="/logo-arrow.png"
            alt=""
            width={24}
            height={24}
            priority
            className="inline-block select-none drop-shadow-[0_0_10px_var(--tw-shadow-color)] [--tw-shadow-color:theme(colors.accent.glow)]"
          />
          <span className="inline-flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wide text-text">CS2 Tracker</span>
            <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">alpha</span>
          </span>
        </Link>

        {/* Center: primary nav (desktop only) */}
        <nav className="pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 md:block">
          <ul className="flex items-center gap-8 text-sm text-text">
            <li><NavLink href="/">Home</NavLink></li>
            <li><NavLink href="/dashboard">Dashboard</NavLink></li>
            <li><NavLink href="/about">About</NavLink></li>
            <li><NavLink href="/privacy">Privacy</NavLink></li>
          </ul>
        </nav>

        {/* Right: account (desktop) + dots (mobile) */}
        <div className="flex items-center gap-2">
          <AccountMenu authed={authed} />
          <DotsUserMenu authed={authed} />
        </div>
      </div>
    </header>
  );
}
