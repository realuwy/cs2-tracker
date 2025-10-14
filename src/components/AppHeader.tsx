"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type User = { name?: string | null; email?: string | null } | null;

export default function AppHeader({ user = null }: { user?: User }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Left: logo */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded"
        >
          {/* neon N */}
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"
               className="drop-shadow-[0_0_10px_var(--tw-shadow-color)] [--tw-shadow-color:theme(colors.accent.glow)]">
            <path d="M3 5h5l8 10h5v4h-6L7 9H3V5z" fill="currentColor" className="text-accent" />
          </svg>
          <span className="text-sm font-semibold tracking-wide text-text">Nightsable</span>
        </Link>

        {/* Center: primary nav */}
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

        {/* Right: user menu (2x2 dots) */}
        <DotsUserMenu user={user} />
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded px-1 py-0.5 text-text/80 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 hover:underline hover:decoration-accent/30 hover:underline-offset-4"
    >
      {children}
    </Link>
  );
}

function DotsUserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!popRef.current || !btnRef.current) return;
      const t = e.target as Node;
      if (!popRef.current.contains(t) && !btnRef.current.contains(t)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface shadow-card hover:bg-surface2 hover:ring-1 hover:ring-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <DotsIcon />
        <span className="sr-only">Open user menu</span>
      </button>

      {open && (
        <div
          ref={popRef}
          role="menu"
          aria-label="User menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-card"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-xs text-muted">
              {user?.email ?? "Guest"}
            </p>
          </div>

          <div className="p-1">
            {user ? (
              <>
                <MenuItem href="/profile" label="Profile" />
                <MenuItem href="/settings" label="Settings" />
                <MenuButton
                  label="Sign out"
                  onClick={() => {
                    // TODO: wire real sign-out
                    window.dispatchEvent(new CustomEvent("signout"));
                    setOpen(false);
                  }}
                />
              </>
            ) : (
              <>
                <MenuButton
                  label="Sign up"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("open-auth", { detail: { mode: "signup" } }));
                    setOpen(false);
                  }}
                />
                <MenuButton
                  label="Log in"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("open-auth", { detail: { mode: "login" } }));
                    setOpen(false);
                  }}
                />
              </>
            )}
            <div className="my-1 border-t border-border" />
            <MenuItem href="/about" label="About" />
            <MenuItem href="/privacy" label="Privacy" />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-text/90 hover:bg-surface2 hover:ring-1 hover:ring-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      {label}
      <span className="text-xs text-muted">↗</span>
    </Link>
  );
}

function MenuButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-text/90 hover:bg-surface2 hover:ring-1 hover:ring-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      {label}
    </button>
  );
}

function DotsIcon() {
  // 2x2 dots like your screenshot
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="text-text">
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="16" cy="8" r="1.5" fill="currentColor" />
      <circle cx="8" cy="16" r="1.5" fill="currentColor" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

