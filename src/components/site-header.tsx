"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/import", label: "Import" },
  { href: "/storage", label: "Storage" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const linkClass = (href: string) =>
    `text-sm transition hover:text-white ${
      pathname === href ? "text-white" : "text-white/70"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/50 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-5 w-5 rounded bg-amber-500" />
          <span>CS2 Tracker</span>
        </Link>

        <nav className="hidden gap-6 sm:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/dashboard"
          className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-white hover:bg-white/15"
        >
          Dashboard
        </Link>
      </div>
    </header>
  );
}
