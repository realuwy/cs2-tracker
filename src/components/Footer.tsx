"use client";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface/90 backdrop-blur">
      {/* Desktop */}
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm">
        {/* Left: brand */}
{/* brand + logo */}
<Link
  href="/"
  aria-label="CS2 Tracker home"
  className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
>
  {/* PNG logo (transparent), a hair bigger for balance */}
  <Image
    src="/logo-arrow.png"
    alt=""
    width={20}   // was an 18px SVG; 20px reads better
    height={20}
    className="inline-block translate-y-[1px] select-none drop-shadow-[0_0_8px_var(--tw-shadow-color)] [--tw-shadow-color:theme(colors.accent.glow)]"
  />
  <span className="font-medium text-text">CS2 Tracker</span>
  <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] leading-none text-accent">
    alpha
  </span>
</Link>


        {/* Center links */}
        <nav className="absolute inset-x-0 mx-auto hidden w-fit items-center gap-6 md:flex">
          <Link
            href="/about"
            className="rounded px-1 text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            About
          </Link>
          <Link
            href="/privacy"
            className="rounded px-1 text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            Privacy
          </Link>
        </nav>

        {/* Right: X link + copyright */}
        <div className="ml-auto flex items-center gap-3 text-muted">
          <a
            href="https://x.com/cs2_tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded px-2 py-1 text-xs text-text/80 hover:text-text underline underline-offset-4 decoration-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-label="CS2 Tracker on X"
            title="Follow on X"
          >
            Follow on X
          </a>
          <span>© {year} CS2 Tracker</span>
        </div>
      </div>

      {/* Mobile */}
      <div className="px-4 pb-6 md:hidden">
        <div className="mt-2 flex justify-center gap-6">
          <Link
            href="/about"
            className="rounded px-1 text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            About
          </Link>
          <Link
            href="/privacy"
            className="rounded px-1 text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            Privacy
          </Link>
        </div>

        <div className="mt-3 flex items-center justify-center gap-3 text-muted">
          <a
            href="https://x.com/cs2_tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded px-2 py-1 text-xs text-text/80 hover:text-text underline underline-offset-4 decoration-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-label="CS2 Tracker on X"
            title="Follow on X"
          >
            Follow on X
          </a>
          <span>© {year} CS2 Tracker</span>
        </div>
      </div>
    </footer>
  );
}


