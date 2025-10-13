"use client";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-slate-800/80">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 md:flex-row">
        {/* left */}
        <div className="flex items-center gap-2 text-slate-300">
          <span className="inline-block h-2 w-2 rounded-full bg-violet-400" />
          <span className="font-medium">CS2 Tracker</span>
          <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">
            alpha
          </span>
        </div>

        {/* center (desktop) / top (mobile) */}
        <nav className="order-2 flex items-center gap-6 text-slate-400 md:order-none">
          <a href="/about" className="hover:text-slate-200">About</a>
          <a href="/privacy" className="hover:text-slate-200">Privacy</a>
        </nav>

        {/* right */}
        <div className="text-slate-400">© {year} CS2 Tracker</div>
      </div>
    </footer>
  );
}

