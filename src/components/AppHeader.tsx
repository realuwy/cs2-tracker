"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

/* ============================================================================
   AppHeader – brand, primary nav (desktop), dots menu (mobile), account menu
   - Shows guest/auth state
   - "Continue as guest" persists local flag (cs2:guest)
   - When signed in, shows “Signed in as …” + Sign Out
   - Minimal, theme-consistent styling
============================================================================ */

/* ---------- small UI atoms ---------- */

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded px-2 py-1 text-text/90 transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      {children}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-muted">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="my-2 h-px bg-border/60" />;
}

function DotsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <circle cx="9" cy="9" r="2" />
      <circle cx="15" cy="9" r="2" />
      <circle cx="9" cy="15" r="2" />
      <circle cx="15" cy="15" r="2" />
    </svg>
  );
}

type MenuItemProps = {
  href?: string;
  onClick?: () => void | Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
};

function MenuItem({ href, onClick, children, disabled }: MenuItemProps) {
  const base =
    "w-full select-none rounded-md px-3 py-2 text-sm text-text/90 hover:bg-surface2/70 focus:bg-surface2/70 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-left";

  if (href && !disabled) {
    return (
      <Link href={href} className={base} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={base}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
    >
      {children}
    </button>
  );
}

/* ---------- Desktop Account Menu ---------- */

function DesktopAccountMenu({
  authed,
  email,
  isGuest,
  onSignOut,
  onContinueGuest,
}: {
  authed: boolean;
  email?: string | null;
  isGuest: boolean;
  onSignOut: () => Promise<void>;
  onContinueGuest: () => void;
}) {
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
        <span className="inline-flex items-center gap-2">
          <span>Account</span>
          {authed ? (
            <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] text-accent">
              Signed in
            </span>
          ) : isGuest ? (
            <span className="inline-flex items-center gap-1 rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-muted">
              Guest
            </span>
          ) : null}
        </span>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M7 10l5 5 5-5H7z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-surface/95 p-2 shadow-lg backdrop-blur"
        >
          {authed ? (
            <>
              <SectionLabel>Account</SectionLabel>
              <div className="px-3 pb-2 text-xs text-muted">
                Signed in as{" "}
                <span className="font-medium text-text/90">{email || "your account"}</span>
              </div>
              <MenuItem href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={async () => {
                  setOpen(false);
                  await onSignOut();
                  router.push("/login");
                  router.refresh();
                }}
              >
                Sign Out
              </MenuItem>
            </>
          ) : (
            <>
              <SectionLabel>Get Started</SectionLabel>
              {isGuest && (
                <div className="px-3 pb-2 text-xs text-muted">
                  You&apos;re in <span className="font-medium text-text/90">guest mode</span>. Your
                  dashboard is saved <em>locally</em>.
                </div>
              )}
              <MenuItem href="/login" onClick={() => setOpen(false)}>
                Sign In
              </MenuItem>
              <MenuItem href="/login" onClick={() => setOpen(false)}>
                Sign Up
              </MenuItem>
              <MenuItem
                onClick={() => {
                  if (!isGuest) onContinueGuest();
                  setOpen(false);
                  router.push("/dashboard");
                }}
              >
                {isGuest ? "Continue as guest (active)" : "Continue as guest"}
              </MenuItem>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Mobile Dots Menu ---------- */

function MobileDotsMenu({
  authed,
  email,
  isGuest,
  onSignOut,
  onContinueGuest,
}: {
  authed: boolean;
  email?: string | null;
  isGuest: boolean;
  onSignOut: () => Promise<void>;
  onContinueGuest: () => void;
}) {
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
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        <DotsIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-surface/95 p-2 shadow-lg backdrop-blur"
        >
          <SectionLabel>Navigation</SectionLabel>
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

          <Divider />

          {authed ? (
            <>
              <SectionLabel>Account</SectionLabel>
              <div className="px-3 pb-2 text-xs text-muted">
                Signed in as{" "}
                <span className="font-medium text-text/90">{email || "your account"}</span>
              </div>
              <MenuItem href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </MenuItem>
              <MenuItem
                onClick={async () => {
                  setOpen(false);
                  await onSignOut();
                  router.push("/login");
                  router.refresh();
                }}
              >
                Sign Out
              </MenuItem>
            </>
          ) : (
            <>
              <SectionLabel>Get Started</SectionLabel>
              {isGuest && (
                <div className="px-3 pb-2 text-xs text-muted">
                  You&apos;re in <span className="font-medium text-text/90">guest mode</span>.
                </div>
              )}
              <MenuItem href="/login" onClick={() => setOpen(false)}>
                Sign In
              </MenuItem>
              <MenuItem href="/login" onClick={() => setOpen(false)}>
                Sign Up
              </MenuItem>
              <MenuItem
                onClick={() => {
                  if (!isGuest) onContinueGuest();
                  setOpen(false);
                  router.push("/dashboard");
                }}
              >
                {isGuest ? "Continue as guest (active)" : "Continue as guest"}
              </MenuItem>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Header (export) ---------- */

export default function AppHeader() {
  const supabase = getSupabaseClient();
  const [authed, setAuthed] = useState<boolean>(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // read & watch guest flag
  useEffect(() => {
    const readGuest = () => {
      try {
        setIsGuest(localStorage.getItem("cs2:guest") === "1");
      } catch {
        setIsGuest(false);
      }
    };
    readGuest();
    window.addEventListener("storage", readGuest);
    return () => window.removeEventListener("storage", readGuest);
  }, []);

  // auth session
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setAuthed(Boolean(data.session?.user?.id));
      setEmail(data.session?.user?.email ?? null);
      const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
        setAuthed(Boolean(sess?.user?.id));
        setEmail(sess?.user?.email ?? null);
        if (sess?.user?.id) {
          // clear guest flag if user signs in
          try {
            localStorage.removeItem("cs2:guest");
          } catch {}
          setIsGuest(false);
        }
      });
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => unsub?.();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    try {
      localStorage.removeItem("cs2:guest");
    } catch {}
    setIsGuest(false);
  };

  const continueAsGuest = () => {
    try {
      localStorage.setItem("cs2:guest", "1");
    } catch {}
    setIsGuest(true);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Left: brand */}
        <Link
          href="/"
          aria-label="CS2 Tracker home"
          className="group inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          {/* PNG logo @24px (44x44 source) */}
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
            <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              alpha
            </span>
          </span>
        </Link>

        {/* Center: primary nav (desktop) */}
        <nav className="pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 md:block">
          <ul className="flex items-center gap-8 text-sm text-text">
            <li>
              <NavLink href="/">Home</NavLink>
            </li>
            <li>
              <NavLink href="/dashboard">Dashboard</NavLink>
            </li>
            <li>
              <NavLink href="/about">About</NavLink>
            </li>
            <li>
              <NavLink href="/privacy">Privacy</NavLink>
            </li>
          </ul>
        </nav>

        {/* Right: Account (desktop) + Dots (mobile) */}
        <div className="flex items-center gap-2">
          <DesktopAccountMenu
            authed={authed}
            email={email}
            isGuest={isGuest}
            onSignOut={handleSignOut}
            onContinueGuest={continueAsGuest}
          />
          <MobileDotsMenu
            authed={authed}
            email={email}
            isGuest={isGuest}
            onSignOut={handleSignOut}
            onContinueGuest={continueAsGuest}
          />
        </div>
      </div>
    </header>
  );
}
