"use client";

import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-slate-800/80">
      <div className="mx-auto max-w-6xl px-4 py-6 md:grid md:grid-cols-3 md:items-center">
        {/* Left: brand (centered on mobile, left on desktop) */}
        <div className="flex items-center justify-center gap-2 md:justify-start text-slate-300">
          <span className="inline-block h-2 w-2 rounded-full bg-violet-400" />
          <span className="font-medium">CS2 Tracker</span>
          <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
            alpha
          </span>
        </div>

        {/* Middle: links (centered on desktop as requested) */}
        <nav className="mt-3 md:mt-0 flex justify-center gap-6 text-slate-400">
          <Link href="/about" className="hover:text-slate-200">
            About
          </Link>
          <Link href="/privacy" className="hover:text-slate-200">
            Privacy
          </Link>
        </nav>

        {/* Right: copyright (center on mobile, right on desktop) */}
        <div className="mt-3 md:mt-0 flex justify-center md:justify-end text-slate-500">
          © {year} CS2 Tracker
        </div>
      </div>
    </footer>
  );
}
