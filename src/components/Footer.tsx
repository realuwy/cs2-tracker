// src/components/SiteFooter.tsx
"use client";

import Link from "next/link";
import Image from "next/image";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
        {/* Brand (match AppHeader) */}
        <Link
          href="/"
          aria-label="CS2 Tracker home"
          className="group inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Image
            src="/logo-arrow.png"
            alt=""
            width={20}
            height={20}
            className="inline-block select-none drop-shadow-[0_0_10px_var(--tw-shadow-color)] [--tw-shadow-color:theme(colors.accent.glow)]"
          />
          <span className="inline-flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wide text-text">CS2 Tracker</span>
            <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              alpha
            </span>
          </span>
        </Link>

        {/* Footer nav */}
        <nav className="text-sm">
          <ul className="flex items-center gap-6 text-text/90">
            <li>
              <Link href="/about" className="hover:text-accent transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-accent transition-colors">
                Privacy
              </Link>
            </li>
            <li>
              <a
                href=""
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                Follow on Twitter
              </a>
            </li>
          </ul>
        </nav>

        {/* Right copyright */}
        <div className="text-xs text-muted">© {year} CS2 Tracker</div>
      </div>
    </footer>
  );
}

