"use client";

import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0b0b0f]/90 backdrop-blur border-t border-slate-800/60">
      {/* Desktop layout */}
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-slate-300">
        {/* Left: brand */}
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-violet-400" />
          <span className="font-medium text-slate-200">CS2 Tracker</span>
          <span className="ml-2 rounded-full bg-slate-800/70 px-2 py-0.5 text-[10px] leading-none text-slate-400">
            alpha
          </span>
        </div>

        {/* Centered links */}
        <nav className="absolute inset-x-0 mx-auto hidden w-fit items-center gap-6 md:flex">
          <Link
            href="/about"
            className="text-slate-300 hover:text-violet-400 transition-colors"
          >
            About
          </Link>
          <Link
            href="/privacy"
            className="text-slate-300 hover:text-violet-400 transition-colors"
          >
            Privacy
          </Link>
        </nav>

        {/* Right: copyright */}
        <div className="ml-auto text-right text-slate-500">
          © {year} CS2 Tracker
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden px-4 pb-6">
        <div className="mt-2 flex justify-center gap-6 text-slate-300">
          <Link
            href="/about"
            className="hover:text-violet-400 transition-colors"
          >
            About
          </Link>
          <Link
            href="/privacy"
            className="hover:text-violet-400 transition-colors"
          >
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
