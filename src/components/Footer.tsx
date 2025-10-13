"use client";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-slate-900/60 bg-[#0b0b0f]">
      {/* Mobile: stacked & centered. Desktop: 3 columns (left brand, CENTERED links, right copyright) */}
      <div className="mx-auto max-w-6xl px-4 py-8
                      flex flex-col items-center gap-4 text-center text-slate-400
                      md:grid md:grid-cols-3 md:items-center md:gap-0 md:text-left">
        {/* Left (brand) */}
        <div className="flex items-center gap-2 justify-center md:justify-start">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-400" />
          <span className="text-slate-200">CS2 Tracker</span>
          <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] text-slate-400 ring-1 ring-slate-800">
            alpha
          </span>
        </div>

        {/* CENTER (About / Privacy) — centered on desktop */}
        <div className="flex gap-4 justify-center">
          <Link href="/about" className="hover:text-slate-200">About</Link>
          <Link href="/privacy" className="hover:text-slate-200">Privacy</Link>
        </div>

        {/* Right (copyright) */}
        <div className="text-slate-500 justify-center md:justify-end flex">
          © {year} CS2 Tracker
        </div>
      </div>
    </footer>
  );
}

