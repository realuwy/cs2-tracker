"use client";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface/90 backdrop-blur">
      {/* -------- Desktop (md+) -------- */}
      <div className="relative mx-auto hidden max-w-6xl items-center justify-between px-4 py-6 text-sm md:flex">
        {/* Left: brand */}
        <Link
          href="/"
          aria-label="CS2 Tracker home"
          className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Image
            src="/logo-arrow.png"
            alt=""
            width={18}
            height={18}
            className="inline-block translate-y-[1px] select-none drop-shadow-[0_0_8px_var(--tw-shadow-color)] [--tw-shadow-color:theme(colors.accent.glow)]"
          />
          <span className="whitespace-nowrap font-medium text-text">CS2 Tracker</span>
          <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] leading-none text-accent">
            alpha
          </span>
        </Link>

        {/* Center: links */}
        <nav className="absolute inset-x-0 mx-auto flex w-fit items-center gap-6">
          <Link href="/about" className="text-muted transition-colors hover:text-accent">
            About
          </Link>
          <Link href="/privacy" className="text-muted transition-colors hover:text-accent">
            Privacy
          </Link>
        </nav>

        {/* Right: social + copyright */}
        <div className="ml-auto flex items-center gap-5 text-sm">
          <a
            href="https://x.com/cs2_tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted underline-offset-4 hover:text-accent hover:underline"
          >
            Follow on X
          </a>
          <div className="text-muted">© {year} CS2 Tracker</div>
        </div>
      </div>

      {/* -------- Mobile (below md) -------- */}
      <div className="mx-auto px-4 py-6 text-sm md:hidden">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2">
          <Image
            src="/logo-arrow.png"
            alt=""
            width={20}
            height={20}
            className="translate-y-[1px] select-none drop-shadow-[0_0_8px_var(--tw-shadow-color)] [--tw-shadow-color:theme(colors.accent.glow)]"
          />
          <span className="whitespace-nowrap font-medium text-text">CS2 Tracker</span>
          <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] leading-none text-accent">
            alpha
          </span>
        </div>

        {/* Links */}
        <nav className="mt-4 flex items-center justify-center gap-6">
          <Link href="/about" className="text-muted transition-colors hover:text-accent">
            About
          </Link>
          <Link href="/privacy" className="text-muted transition-colors hover:text-accent">
            Privacy
          </Link>
        </nav>

        {/* Social + copyright */}
        <div className="mt-4 flex flex-col items-center gap-2 text-muted">
          <a
            href="https://x.com/cs2_tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:text-accent hover:underline"
          >
            Follow on X
          </a>
          <div>© {year} CS2 Tracker</div>
        </div>
      </div>
    </footer>
  );
}


