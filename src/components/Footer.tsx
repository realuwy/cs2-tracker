"use client";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface/90 backdrop-blur">
      {/* Desktop layout */}
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm">
        {/* Left: brand */}
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="font-medium">CS2 Tracker</span>
          <span className="ml-2 rounded-full bg-surface2/70 px-2 py-0.5 text-[10px] leading-none text-muted">
            alpha
          </span>
        </div>

        {/* Centered links */}
        <nav className="absolute inset-x-0 mx-auto hidden w-fit items-center gap-6 md:flex">
          <Link href="/about" className="text-muted hover:text-accent transition-colors">
            About
          </Link>
          <Link href="/privacy" className="text-muted hover:text-accent transition-colors">
            Privacy
          </Link>
        </nav>

        {/* Right: copyright */}
        <div className="ml-auto text-right text-muted">© {year} CS2 Tracker</div>
      </div>

      {/* Mobile layout */}
      <div className="px-4 pb-6 md:hidden">
        <div className="mt-2 flex justify-center gap-6">
          <Link href="/about" className="text-muted hover:text-accent transition-colors">
            About
          </Link>
          <Link href="/privacy" className="text-muted hover:text-accent transition-colors">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
