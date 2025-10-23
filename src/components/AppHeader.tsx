// src/components/AppHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function AppHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // active link helper
  const isActive = (href: string) =>
    pathname === href
      ? "text-text neon-underline"
      : "text-muted hover:text-text";

  // close mobile menu on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // open modals via global events
  const openContact = () =>
    window.dispatchEvent(new CustomEvent("contact:open"));

  const openAuth = (mode: "signin" | "signup" | "chooser" = "signin") =>
    window.dispatchEvent(new CustomEvent("auth:open", { detail: mode }));

  /* ---------- Render ---------- */
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span>CS2 Tracker</span>
          <span className="badge badge-accent">alpha</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/" className={isActive("/")}>Home</Link>
          <Link href="/dashboard" className={isActive("/dashboard")}>Dashboard</Link>
          <Link href="/about" className={isActive("/about")}>About</Link>
          <Link href="/privacy" className={isActive("/privacy")}>Privacy</Link>

          {/* Contact: button styled like a link */}
          <button
            type="button"
            onClick={openContact}
            className="relative inline-block bg-transparent p-0 pb-1 text-muted hover:text-text align-middle"
          >
            Contact
          </button>
        </nav>

        {/* Right: account + mobile menu */}
        <div className="flex items-center gap-2">
          {/* Simple account trigger on desktop */}
          <button
            type="button"
            className="hidden rounded-xl border border-border bg-surface2/70 px-3 py-1.5 text-sm hover:bg-surface md:inline-flex"
            onClick={() => openAuth("signin")}
          >
            Account
          </button>

          {/* Mobile menu */}
          <div className="relative md:hidden" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Open menu"
              className="rounded-lg border border-border bg-surface2/70 px-2 py-1"
            >
              {/* simple dots icon */}
              <span className="inline-block h-1 w-1 rounded-full bg-text align-middle" />
              <span className="mx-1 inline-block h-1 w-1 rounded-full bg-text align-middle" />
              <span className="inline-block h-1 w-1 rounded-full bg-text align-middle" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface p-2 shadow-xl">
                <ul className="space-y-1 text-sm">
                  <li>
                    <Link
                      href="/"
                      className="block rounded-lg px-3 py-2 hover:bg-surface2/70"
                      onClick={() => setMenuOpen(false)}
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard"
                      className="block rounded-lg px-3 py-2 hover:bg-surface2/70"
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className="block rounded-lg px-3 py-2 hover:bg-surface2/70"
                      onClick={() => setMenuOpen(false)}
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy"
                      className="block rounded-lg px-3 py-2 hover:bg-surface2/70"
                      onClick={() => setMenuOpen(false)}
                    >
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => { openContact(); setMenuOpen(false); }}
                      className="block w-full text-left rounded-lg px-3 py-2 hover:bg-surface2/70"
                    >
                      Contact
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => { openAuth("signin"); setMenuOpen(false); }}
                      className="block w-full text-left rounded-lg px-3 py-2 hover:bg-surface2/70"
                    >
                      Account
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
