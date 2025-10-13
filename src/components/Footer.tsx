"use client";

import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    // Header-like bar: same dark bg but no border line
    <footer className="bg-[#0b0b0b]/90 backdrop-blur">
      {/* Desktop layout */}
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-slate-300">
        {/* Left: brand */}
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-violet-400" />
          <span className="font-medium">CS2 Tracker</span>
          <span className="ml-2 rounded-full bg-slate-800/70 px-2 py-0.5 text-[10px] leading-none text-slate-300">
            alpha
          </span>
        </div>

        {/* Centered links on desktop */}
        <nav className="absolute inset-x-0 mx-auto hidden w-fit items-center gap-6 md:flex">
          <Link href="/about" className="hover:text-white">
            About
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
        </nav>

        {/* Right: copyright */}
        <div className="ml-auto text-right text-slate-400">© {year} CS2 Tracker</div>
      </div>

      {/* Mobile layout (unchanged) */}
      <div className="md:hidden px-4 pb-6">
        <div className="mt-2 flex justify-center gap-6 text-slate-300">
          <Link href="/about" className="hover:text-white">
            About
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}

