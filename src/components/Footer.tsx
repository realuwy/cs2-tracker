"use client";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-10 border-t border-zinc-800 bg-black/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 p-6 text-sm text-zinc-400 md:flex-row">
        <div className="space-x-4">
          <Link href="/about" className="hover:text-zinc-200">About</Link>
          <span className="text-zinc-600">•</span>
          <Link href="/privacy" className="hover:text-zinc-200">Privacy</Link>
        </div>
        <div className="text-zinc-500">
          © {year} CS2 Tracker — <span className="text-zinc-400">alpha</span>
        </div>
      </div>
    </footer>
  );
}
