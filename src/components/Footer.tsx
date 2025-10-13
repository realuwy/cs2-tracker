"use client";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-slate-900/60 bg-[#0b0b0f]">
      <div
        className="
          mx-auto max-w-6xl px-4 py-8
          flex flex-col items-center gap-4 text-center text-slate-400
          md:flex-row md:justify-between md:text-left
        "
      >
        {/* left cluster */}
        <div className="flex flex-col items-center gap-2 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-400" />
            <span className="text-slate-200">CS2 Tracker</span>
            <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] text-slate-400 ring-1 ring-slate-800">
              alpha
            </span>
          </div>

          {/* divider on mobile */}
          <div className="hidden md:block mx-3 h-4 w-px bg-slate-800" />

          <div className="flex gap-4">
            <Link href="/about" className="hover:text-slate-200">About</Link>
            <Link href="/privacy" className="hover:text-slate-200">Privacy</Link>
          </div>
        </div>

        {/* right cluster */}
        <div className="text-slate-500">© {year} CS2 Tracker</div>
      </div>
    </footer>
  );
}
