// src/components/SiteFooter.tsx  (or rename to footer.tsx if you prefer)
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-bg/70">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Brand + build tag */}
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="text-text/80">CS2 Tracker</span>
          <span className="hidden md:inline text-muted">•</span>
          <span className="text-muted">alpha</span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-6">
          <Link href="/about" className="hover:text-text">About</Link>
          <Link href="/privacy" className="hover:text-text">Privacy</Link>
          <Link href="/dashboard" className="hover:text-text">Dashboard</Link>
        </nav>

        {/* Copyright */}
        <div className="text-muted">© {year} CS2 Tracker</div>
      </div>
    </footer>
  );
}
