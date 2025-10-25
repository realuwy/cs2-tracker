// src/components/AppHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/60 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Left: brand */}
        <div className="flex items-center gap-2">
          <span className="text-accent">🔫</span>
          <Link href="/" className="font-semibold text-text">
            CS2 Tracker
          </Link>
          <span className="badge badge-accent">alpha</span>
        </div>

        {/* Center nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {[
            ["Home", "/"],
            ["Dashboard", "/dashboard"],
            ["About", "/about"],
            ["Privacy", "/privacy"],
            ["Contact", "/contact"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "transition-colors hover:text-accent",
                pathname === href && "text-accent underline underline-offset-4"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: Account dropdown only */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-surface/80">
              Account
              <span className="ml-2 text-xs text-amber-400">New</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
