"use client";

import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--bg)]/90 backdrop-blur border-t border-[var(--border)]">
      {/* Desktop layout */}
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-slate-300">
        {/* Left: brand */}
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          <span className="font-medium text-[var(--text)]">CS2 Tracker</span>
          <span className="ml-2 rounded-full bg-white/5 px-2 py-0.5 text-[10px] leading-none text-[var(--muted)]">
            alpha
          </span>
        </div>

        {/* Centered links */}
        <nav className="absolute inset-x-0 mx-auto hidden w-fit items-center gap-6 md:flex">
          <Link
            href="/about"
            className="text-slate-300 transition-colors hover:text-[var(--accent)]"
          >
            About
          </Link>
          <Link
            href="/privacy"
            className="text-slate-300 transition-colors hover:text-[var(--accent)]"
          >
            Privacy
          </Link>
        </nav>

        {/* Right: copyright */}
        <div className="ml-auto text-right text-slate-500">© {year} CS2 Tracker</div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden px-4 pb-6">
        <div className="mt-2 flex justify-center gap-6 text-slate-300">
          <Link href="/about" className="transition-colors hover:text-[var(--accent)]">
            About
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-[var(--accent)]">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
