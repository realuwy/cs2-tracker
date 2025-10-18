"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import SignOutButton from "@/components/SignOutButton";
import { getSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type User = { name?: string | null; email?: string | null } | null;

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-text/80 hover:text-text transition-colors">
      {children}
    </Link>
  );
}

function DotsIcon({ className = "h-4 w-4" }) {
  // 2×2 grid of dots
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="9"  cy="9"  r="1.8" />
      <circle cx="15" cy="9"  r="1.8" />
      <circle cx="9"  cy="15" r="1.8" />
      <circle cx="15" cy="15" r="1.8" />
    </svg>
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

function DotsUserMenu({ authed }: { authed: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // click-outside + Esc close
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="User menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text/90 hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        <DotsIcon />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface/95 p-2 shadow-lg backdrop-blur"
        >
          {authed ? (
            <>
              <MenuItem href="/dashboard" onClick={() => setIsOpen(false)}>
                Dashboard
              </MenuItem>
              <div className="my-1 h-px bg-border/60" />
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
              <MenuItem href="/login" onClick={() => setIsOpen(false)}>
                Sign In
              </MenuItem>
              <MenuItem href="/login" onClick={() => setIsOpen(false)}>
                Sign Up
              </MenuItem>
              <div className="my-1 h-px bg-border/60" />
              <MenuItem
                onClick={() => {
                  try {
                    localStorage.setItem("cs2:guest", "1");
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

export default function AppHeader({ user = null }: { user?: User }) {
  const supabase = getSupabaseClient();
  const [authed, setAuthed] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setAuthed(data.session?.user?.id ?? null);
      const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
        setAuthed(sess?.user?.id ?? null);
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

        {/* Center: nav */}
        <nav className="pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 md:block">
          <ul className="flex items-center gap-8 text-sm text-text">
            <li><NavLink href="/">Home</NavLink></li>
            <li><NavLink href="/dashboard">Dashboard</NavLink></li>
            <li><NavLink href="/about">About</NavLink></li>
            <li><NavLink href="/privacy">Privacy</NavLink></li>
          </ul>
        </nav>

        {/* Right: dots menu */}
        <DotsUserMenu authed={Boolean(authed)} />
      </div>
    </header>
  );
}

