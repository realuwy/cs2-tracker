"use client";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface/90 backdrop-blur">
      {/* Desktop layout */}
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm">
        {/* Left: brand (logo + name + alpha) */}
        <Link
          href="/"
          aria-label="CS2 Tracker home"
          className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          {/* rising-arrow mark */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="text-accent drop-shadow-[0_0_10px_var(--tw-shadow-color)] [--tw-shadow-color:theme(colors.accent.glow)]"
          >
            <polyline
              points="4,16 11,16 16,7"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polygon points="16,4 22,4 22,10" fill="currentColor" />
          </svg>
          <span className="font-medium text-text">CS2 Tracker</span>
          <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] leading-none text-accent">
            alpha
          </span>
        </Link>

        {/* Centered links */}
        <nav className="absolute inset-x-0 mx-auto hidden w-fit items-center gap-6 md:flex">
          <Link href="/about" className="text-muted transition-colors hover:text-accent">
            About
          </Link>
          <Link href="/privacy" className="text-muted transition-colors hover:text-accent">
            Privacy
          </Link>
        </nav>

        {/* Right: copyright */}
        <div className="ml-auto text-right text-muted">© {year} CS2 Tracker</div>
      </div>

      {/* Mobile layout */}
      <div className="px-4 pb-6 md:hidden">
        <div className="mt-2 flex justify-center gap-6">
          <Link href="/about" className="text-muted transition-colors hover:text-accent">
            About
          </Link>
          <Link href="/privacy" className="text-muted transition-colors hover:text-accent">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}

