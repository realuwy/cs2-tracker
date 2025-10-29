"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

async function clearLocalWithConfirm() {
  if (!confirm("This clears your local inventory on this device. Cloud data (for signed-in email) stays intact. Continue?")) return;
  try {
    const keys = ["cs2:dashboard:rows", "cs2:dashboard:rows:updatedAt"];
    keys.forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(new Event("storage"));
  } catch {}
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={[
        "relative pb-1 transition-colors",
        active
          ? "text-accent after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-accent after:shadow-[0_0_8px_var(--tw-shadow-color)] after:[--tw-shadow-color:theme(colors.accent.glow)]"
          : "text-muted hover:text-text",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function DotsButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border",
        "border-border bg-surface2/70 hover:bg-surface transition",
        "focus:outline-none focus:ring-2 focus:ring-accent/30",
        props.className || "",
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
        <circle cx="8" cy="8" r="1.75" />
        <circle cx="16" cy="8" r="1.75" />
        <circle cx="8" cy="16" r="1.75" />
        <circle cx="16" cy="16" r="1.75" />
      </svg>
    </button>
  );
}

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const acctRef = useRef<HTMLDivElement | null>(null);

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data: { email: string | null } = await res.json();
      setEmail(data?.email ?? null);
    } catch {
      setEmail(null);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    setCheckingAuth(true);
    refreshAuth();
  }, [refreshAuth, pathname]);

  useEffect(() => {
    const onAuthChanged = () => refreshAuth();
    window.addEventListener("auth:changed", onAuthChanged);
    return () => window.removeEventListener("auth:changed", onAuthChanged);
  }, [refreshAuth]);

  useEffect(() => {
    const refetch = () => refreshAuth();
    const onVis = () => {
      if (document.visibilityState === "visible") refetch();
    };
    window.addEventListener("focus", refetch);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", refetch);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refreshAuth]);

  useEffect(() => {
    const closeOnOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuOpen && menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
      if (accountOpen && acctRef.current && !acctRef.current.contains(t)) setAccountOpen(false);
    };
    window.addEventListener("mousedown", closeOnOutside);
    return () => window.removeEventListener("mousedown", closeOnOutside);
  }, [menuOpen, accountOpen]);

  async function logoutEmail() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setEmail(null);
    window.dispatchEvent(new Event("auth:changed"));
    router.refresh();
  }

  async function resendCode() {
    try {
      const res = await fetch("/api/auth/resend", { method: "POST" });
      if (!res.ok) throw new Error();
      alert("Verification email sent again. Check your inbox.");
    } catch {
      alert("Could not send email. Try again shortly.");
    }
  }

  // Button text is ALWAYS "Account"
  const accountLabel = "Account";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* brand */}
        <Link
          href="/"
          aria-label="CS2 Tracker home"
          className="group inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
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
            <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              alpha
            </span>
          </span>
        </Link>

        {/* center nav (desktop) */}
        <nav className="pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 md:block">
          <ul className="flex items-center gap-8 text-sm text-text">
            <li><NavLink href="/">Home</NavLink></li>
            <li><NavLink href="/dashboard">Dashboard</NavLink></li>
            <li><NavLink href="/about">About</NavLink></li>
            <li><NavLink href="/privacy">Privacy</NavLink></li>
          </ul>
        </nav>

        {/* right actions */}
        <div className="flex items-center gap-2">
          {/* account dropdown */}
          <div className="relative" ref={acctRef}>
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface2/70 px-3 py-1.5 text-sm hover:bg-surface transition focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <span>{accountLabel}</span>
              <svg viewBox="0 0 24 24" width="14" height="14" className="opacity-70">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {accountOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-surface p-2 shadow-xl">
                <div className="px-3 pb-2 pt-1 text-[11px] uppercase tracking-wider text-muted">
                  {checkingAuth
                    ? "Checking…"
                    : email
                      ? `Signed in as ${email}`
                      : "Sign in"}
                </div>

                {email ? (
                  <>
                    <hr className="my-2 border-border/70" />

                    <button
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                      onClick={() => router.push("/dashboard")}
                    >
                      Open dashboard
                    </button>

                    <button
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                      onClick={clearLocalWithConfirm}
                    >
                      Clear local data
                    </button>

                    <button
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                      onClick={resendCode}
                    >
                      Resend verification email
                    </button>

                    <button
                      role="menuitem"
                      className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-400/10"
                      onClick={logoutEmail}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                      onClick={() => { setAccountOpen(false); window.dispatchEvent(new Event("auth:open")); }}
                    >
                      Sign in with email
                    </button>

                    <button
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                      onClick={clearLocalWithConfirm}
                    >
                      Clear local data
                    </button>

                    <button
                      role="menuitem"
                      className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-amber-300 hover:bg-amber-400/10"
                      onClick={resendCode}
                    >
                      Resend verification email
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* mobile dots menu */}
          <div className="relative md:hidden" ref={menuRef}>
            <DotsButton onClick={() => setMenuOpen((v) => !v)} aria-label="Open menu" />
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface p-2 shadow-xl">
                <ul className="space-y-1 text-sm">
                  <li><Link href="/" className="block rounded-lg px-3 py-2 hover:bg-surface2/70" onClick={() => setMenuOpen(false)}>Home</Link></li>
                  <li><Link href="/dashboard" className="block rounded-lg px-3 py-2 hover:bg-surface2/70" onClick={() => setMenuOpen(false)}>Dashboard</Link></li>
                  <li><Link href="/about" className="block rounded-lg px-3 py-2 hover:bg-surface2/70" onClick={() => setMenuOpen(false)}>About</Link></li>
                  <li><Link href="/privacy" className="block rounded-lg px-3 py-2 hover:bg-surface2/70" onClick={() => setMenuOpen(false)}>Privacy</Link></li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
