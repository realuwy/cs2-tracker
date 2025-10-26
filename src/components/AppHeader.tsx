// src/components/AppHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/* ----------------------------- NavLink ----------------------------- */

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

/* ------------------------------ AppHeader ------------------------------ */

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  // auth state (email login)
  const [email, setEmail] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);

  // Single QR (shown inside Account dropdown)
  const [showQr, setShowQr] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const acctRef = useRef<HTMLDivElement | null>(null);

  const openAuth = () => window.dispatchEvent(new Event("auth:open"));

  const readAuth = () => {
    const e = typeof window !== "undefined" ? localStorage.getItem("cs2:email") : null;
    const t = typeof window !== "undefined" ? localStorage.getItem("cs2:token") : null;
    setEmail(e);
    setHasToken(!!t);
  };

  // initial snapshot + refresh on route & auth changes
  useEffect(() => { readAuth(); }, []);
  useEffect(() => { readAuth(); }, [pathname]);
  useEffect(() => {
    const onAuth = () => readAuth();
    window.addEventListener("auth:changed", onAuth);
    return () => window.removeEventListener("auth:changed", onAuth);
  }, []);

  // click-outside to close menus
  useEffect(() => {
    const closeOnOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuOpen && menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
      if (accountOpen && acctRef.current && !acctRef.current.contains(t)) {
        setAccountOpen(false);
        setShowQr(false);
      }
    };
    window.addEventListener("mousedown", closeOnOutside);
    return () => window.removeEventListener("mousedown", closeOnOutside);
  }, [menuOpen, accountOpen]);

// inside useEffect that generates the QR
useEffect(() => {
  let mounted = true;
  async function makeQr() {
    if (!accountOpen || !userId) return;
    try {
      const { toDataURL } = await import("qrcode");
      const site =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const link = `${site}/open?id=${encodeURIComponent(userId)}`;
      const url = await toDataURL(link, { width: 160, margin: 1 });
      if (mounted) setQrUrl(url);
    } catch {
      if (mounted) setQrUrl(null);
    }
  }
  makeQr();
  return () => {
    mounted = false;
  };
}, [accountOpen, userId]);


  function signOut() {
    localStorage.removeItem("cs2:email");
    localStorage.removeItem("cs2:token");
    // optional: clean up any legacy keys
    localStorage.removeItem("cs2:id");
    window.dispatchEvent(new Event("auth:changed"));
    setShowQr(false);
    setAccountOpen(false);
    router.push("/");
  }

  function clearLocal() {
    // clears all local app data on this device
    localStorage.removeItem("cs2:email");
    localStorage.removeItem("cs2:token");
    localStorage.removeItem("cs2:id"); // legacy
    window.dispatchEvent(new Event("auth:changed"));
    setShowQr(false);
    setAccountOpen(false);
    router.push("/");
    // Optionally reopen auth modal:
    // openAuth();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* left brand */}
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
              onClick={() => { setAccountOpen((v) => !v); if (accountOpen) setShowQr(false); }}
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface2/70 px-3 py-1.5 text-sm hover:bg-surface transition focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <span>Account</span>
              {hasToken ? (
                <span className="rounded bg-emerald-400/15 px-1.5 py-[1px] text-[10px] text-emerald-300">
                  Signed in
                </span>
              ) : (
                <span className="rounded bg-amber-400/15 px-1.5 py-[1px] text-[10px] text-amber-300">
                  Guest
                </span>
              )}
              <svg viewBox="0 0 24 24" width="14" height="14" className="opacity-70">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {accountOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-surface p-2 shadow-xl">
                <div className="px-2 pb-2 pt-1 text-[10px] uppercase tracking-wider text-muted">Identity</div>

                {hasToken ? (
                  <div className="px-3 pb-2 text-xs text-muted">
                    Signed in as:
                    <div className="mt-1 select-all rounded-lg bg-surface2/70 px-2 py-1 font-mono text-[11px] text-text">
                      {email}
                    </div>
                  </div>
                ) : (
                  <div className="px-3 pb-2 text-xs text-muted">
                    You’re using guest mode. Sign in with your email to sync across devices.
                  </div>
                )}

                <hr className="my-1 border-border/70" />

                {!hasToken ? (
                  <>
                    <button
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                      onClick={() => { setAccountOpen(false); openAuth(); }}
                    >
                      Sign in with email
                    </button>

                    <button
                      role="menuitem"
                      className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-400/10"
                      onClick={clearLocal}
                    >
                      Clear local data
                    </button>
                  </>
                ) : (
                  <>
                    {/* Signed-in actions */}
                    <button
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                      onClick={() => setShowQr((v) => !v)}
                    >
                      {showQr ? "Hide QR code" : "Show QR code"}
                    </button>

                    {showQr && (
                      <div className="mx-3 mt-2 rounded-lg border border-border bg-surface2/70 p-3 text-center">
                        {qrUrl ? (
                          <>
                            <img
                              src={qrUrl}
                              alt="Scan to open on phone"
                              className="mx-auto rounded-lg border border-border"
                              width={160}
                              height={160}
                            />
                            <div className="mt-2 flex items-center justify-center gap-2">
                              <a
                                href={qrUrl}
                                download="cs2tracker-open-on-phone.png"
                                className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-surface/60"
                              >
                                Download PNG
                              </a>
                              <button
                                className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-surface/60"
                                onClick={() => {
                                  try {
                                    const origin = window.location.origin;
                                    const r = window.location.pathname + window.location.search;
                                    const url = `${origin}/pair?email=${encodeURIComponent(email ?? "")}&r=${encodeURIComponent(r)}`;
                                    navigator.clipboard.writeText(url);
                                  } catch {}
                                }}
                              >
                                Copy link
                              </button>
                            </div>
                            <p className="mt-1 text-[11px] text-muted">
                              Scan on your phone — it opens this same page and signs you in.
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-muted">Generating QR…</p>
                        )}
                      </div>
                    )}

                    <button
                      role="menuitem"
                      className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-400/10"
                      onClick={signOut}
                    >
                      Sign out
                    </button>
                  </>
                )}

                <hr className="my-2 border-border/70" />

                {/* Always offer email flow entry point */}
                <button
                  role="menuitem"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                  onClick={() => { setAccountOpen(false); openAuth(); }}
                >
                  Sign in / Recover by email
                </button>
              </div>
            )}
          </div>

          {/* mobile dots menu */}
          <div className="relative md:hidden" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
              className={[
                "inline-flex h-9 w-9 items-center justify-center rounded-lg border",
                "border-border bg-surface2/70 hover:bg-surface transition",
                "focus:outline-none focus:ring-2 focus:ring-accent/30",
              ].join(" ")}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
                <circle cx="8" cy="8" r="1.75" />
                <circle cx="16" cy="8" r="1.75" />
                <circle cx="8" cy="16" r="1.75" />
                <circle cx="16" cy="16" r="1.75" />
              </svg>
            </button>
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
