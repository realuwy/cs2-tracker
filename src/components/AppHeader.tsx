"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();
  const active = (href: string) =>
    pathname === href ? "text-amber-400" : "text-zinc-300 hover:text-zinc-100";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/70 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-sm font-medium text-zinc-200">CS2 Tracker</span>
          <span className="ml-2 rounded-full border border-amber-600/40 bg-amber-600/15 px-1.5 py-0.5 text-[10px] text-amber-400">
            ALPHA
          </span>
        </Link>

        {/* Core Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/dashboard" className={`text-sm ${active("/dashboard")}`}>
            Dashboard
          </Link>
        </nav>

        {/* Right (Account) */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Account
          </Link>
        </div>
      </div>
    </header>
  );
}
