"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import SignOutButton from "@/components/SignOutButton";
import { getSupabaseClient } from "@/lib/supabase";

type User = { name?: string | null; email?: string | null } | null;

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-text/80 hover:text-text transition-colors"
    >
      {children}
    </Link>
  );
}

export default function AppHeader({ user = null }: { user?: User }) {
  const supabase = getSupabaseClient();
  const [authed, setAuthed] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setAuthed(data.session?.user?.id ?? null);
      const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
        setAuthed(sess?.user?.id ?? null);
      });
      unsub = () => sub.subscription.unsubscribe();
    };

    init();
    return () => unsub?.();
  }, [supabase]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Left: brand */}
        <Link
          href="/"
          aria-label="CS2 Tracker home"
          className="group inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          {/* PNG logo @24px (44x44 source) */}
          <Image
            src="/logo-arrow.png"
            alt=""
            width={24}
            height={24}
            priority
            className="inline-block select-none drop-shadow-[0_0_10px_var(--tw-shadow-color)] [--tw-shadow-color:theme(colors.accent.glow)]"
          />
          <span className="inline-flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wide text-text">CS2 Tracker</span>
            <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">alpha</span>
          </span>
        </Link>

        {/* Center: primary nav */}
        <nav className="pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 md:block">
          <ul className="flex items-center gap-8 text-sm text-text">
            <li><NavLink href="/">Home</NavLink></li>
            <li><NavLink href="/dashboard">Dashboard</NavLink></li>
            <li><NavLink href="/about">About</NavLink></li>
            <li><NavLink href="/privacy">Privacy</NavLink></li>
          </ul>
        </nav>

        {/* Right: auth actions */}
        <div className="flex items-center gap-2">
          {authed ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg border border-border bg-surface2 px-3 py-2 text-sm hover:bg-surface"
              >
                Dashboard
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-border bg-surface2 px-3 py-2 text-sm hover:bg-surface"
              >
                Sign In
              </Link>
              <Link href="/login" className="btn-accent px-3 py-2 text-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
