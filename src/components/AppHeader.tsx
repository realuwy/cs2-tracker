// src/components/AppHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

/* ---------- Small helpers ---------- */

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

/** 4-dot icon button used for the mobile menu */
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

type SessionName = string | null; // username preferred, else email

export default function AppHeader() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const [sessionName, setSessionName] = useState<SessionName>(null);
  const [menuOpen, setMenuOpen] = useState(false);       // mobile dots
  const [accountOpen, setAccountOpen] = useState(false); // account dropdown
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const acctRef = useRef<HTMLDivElement | null>(null);

  /* ---------- Guest-mode sync helpers ---------- */

  const syncGuest = () => {
    try {
      setIsGuest(localStorage.getItem("guest_mode") === "true");
    } catch {
      setIsGuest(false);
    }
  };

  // initial read + listeners for guest events / storage
  useEffect(() => {
    syncGuest();

    const onGuestEnabled = () => syncGuest();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "guest_mode") syncGuest();
    };

    window.addEventListener("guest:enabled", onGuestEnabled as EventListener);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("guest:enabled", onGuestEnabled as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // re-check when route changes
  useEffect(() => {
    syncGuest();
  }, [pathname]);

  /* ---------- Supabase session -> name ---------- */
  useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      setSessionName(
        (user?.user_metadata as any)?.username || user?.email || null
      );

      const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
        const u = sess?.user;
        setSessionName(
          (u?.user_metadata as any)?.username || u?.email || null
        );
        // Clear guest flag on successful login
        if (sess?.user) {
          try {
            localStorage.removeItem("guest_mode");
          } catch {}
          setIsGuest(false);
        }
      });

      unsub = () => sub.subscription.unsubscribe();
    })();

    return () => unsub?.();
  }, [supabase]);

  /* ---------- Click outside to close menus ---------- */
  useEffect(() => {
    const closeOnOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuOpen && menuRef.current && !menuRef.current.contains(t)) {
        setMenuOpen(false);
      }
      if (accountOpen && acctRef.current && !acctRef.current.contains(t)) {
        setAccountOpen(false);
      }
    };
    window.addEventListener("mousedown", closeOnOutside);
    return () => window.removeEventListener("mousedown", closeOnOutside);
  }, [menuOpen, accountOpen]);

  /* ---------- Optional: open Account via ?account=open ---------- */
  useEffect(() => {
    if (search.get("account") === "open") {
      setAccountOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("account");
      window.history.replaceState({}, "", url.toString());
    }
  }, [search]);

  /* ---------- Actions ---------- */

  const openSignIn = () =>
    window.dispatchEvent(new CustomEvent("auth:open", { detail: "signin" }));
  const openSignUp = () =>
    window.dispatchEvent(new CustomEvent("auth:open", { detail: "signup" }));

  const continueAsGuest = () => {
    try {
      localStorage.setItem("guest_mode", "true");
    } catch {}
    setIsGuest(true);
    window.dispatchEvent(new Event("guest:enabled"));
    router.push("/dashboard");
    setTimeout(() => router.refresh(), 0);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSessionName(null);
    // Land as guest after sign out
    try {
      localStorage.setItem("guest_mode", "true");
    } catch {}
    setIsGuest(true);
    router.push("/");
  };

  const authed = !!sessionName;

  /* ---------- Settings modal actions ---------- */

  const openSettings = () => {
    setSettingsMsg(null);
    setConfirmClear(false);
    setSettingsOpen(true);
  };

  const sendPasswordReset = async () => {
    setSettingsMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email;
      if (!email) throw new Error("No signed-in user.");
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? `${location.origin}/reset` : undefined,
      });
      if (error) throw error;
      setSettingsMsg("Password reset link sent. Check your email.");
    } catch (e: any) {
      setSettingsMsg(e?.message ?? "Could not send reset email.");
    }
  };

  const clearLocalRows = () => {
    try {
      // Clear common local keys (adjust if your app uses different keys)
      localStorage.removeItem("rows");
      localStorage.removeItem("dashboard_rows");
    } catch {}
  };

  const clearAccountData = async () => {
    setClearing(true);
    setSettingsMsg(null);
    try {
      // Clear local first
      clearLocalRows();

      // If signed in: empty the JSONB rows for this user
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        // Prefer update to empty array (safer with RLS)
        const { error } = await supabase
          .from("account_rows")
          .update({ rows: [] })
          .eq("user_id", user.id);
        if (error) throw error;
      }
      // Notify app parts that cache may be stale
      window.dispatchEvent(new Event("rows:cleared"));
      setSettingsMsg("All data cleared.");
      setConfirmClear(false);
    } catch (e: any) {
      setSettingsMsg(e?.message ?? "Failed to clear data.");
    } finally {
      setClearing(false);
    }
  };

  /* ---------- Render ---------- */

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Left: brand */}
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
              <span className="text-sm font-semibold tracking-wide text-text">
                CS2 Tracker
              </span>
              <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                alpha
              </span>
            </span>
          </Link>

          {/* Center: primary nav (desktop only) */}
          <nav className="pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 md:block">
            <ul className="flex items-center gap-8 text-sm text-text">
              <li><NavLink href="/">Home</NavLink></li>
              <li><NavLink href="/dashboard">Dashboard</NavLink></li>
              <li><NavLink href="/about">About</NavLink></li>
              <li><NavLink href="/privacy">Privacy</NavLink></li>
            </ul>
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            {/* Account dropdown (desktop & mobile) */}
            <div className="relative" ref={acctRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface2/70 px-3 py-1.5 text-sm hover:bg-surface transition focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <span>Account</span>
                {authed && (
                  <span className="rounded bg-accent/20 px-1.5 py-[1px] text-[10px] text-accent">
                    Signed in
                  </span>
                )}
                {isGuest && !authed && (
                  <span className="rounded bg-amber-400/15 px-1.5 py-[1px] text-[10px] text-amber-300">
                    Guest
                  </span>
                )}
                <svg viewBox="0 0 24 24" width="14" height="14" className="opacity-70">
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {accountOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-surface p-2 shadow-xl">
                  <div className="px-2 pb-2 pt-1 text-[10px] uppercase tracking-wider text-muted">
                    Account
                  </div>

                  <div className="px-3 pb-2 text-xs text-muted">
                    {authed ? (
                      <>Signed in as <span className="text-text">{sessionName}</span></>
                    ) : isGuest ? (
                      <>Browsing as <span className="text-text">Guest</span></>
                    ) : (
                      <>Not signed in</>
                    )}
                  </div>

                  <hr className="my-1 border-border/70" />

                  {/* Signed out / Guest actions */}
                  {!authed && (
                    <>
                      <button
                        role="menuitem"
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                        onClick={() => { setAccountOpen(false); openSignIn(); }}
                      >
                        Sign In
                      </button>
                      <button
                        role="menuitem"
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                        onClick={() => { setAccountOpen(false); openSignUp(); }}
                      >
                        Sign Up
                      </button>
                      <button
                        role="menuitem"
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                        onClick={() => { setAccountOpen(false); continueAsGuest(); }}
                      >
                        Continue as guest
                      </button>
                    </>
                  )}

                  {/* Signed in actions: Settings + Sign Out */}
                  {authed && (
                    <>
                      <button
                        role="menuitem"
                        className="block rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                        onClick={() => { setAccountOpen(false); openSettings(); }}
                      >
                        Settings
                      </button>
                      <button
                        role="menuitem"
                        className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-400/10"
                        onClick={() => { setAccountOpen(false); signOut(); }}
                      >
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Dots menu – mobile only */}
            <div className="relative md:hidden" ref={menuRef}>
              <DotsButton onClick={() => setMenuOpen((v) => !v)} aria-label="Open menu" />
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface p-2 shadow-xl">
                  <ul className="space-y-1 text-sm">
                    <li>
                      <Link href="/" className="block rounded-lg px-3 py-2 hover:bg-surface2/70" onClick={() => setMenuOpen(false)}>
                        Home
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard" className="block rounded-lg px-3 py-2 hover:bg-surface2/70" onClick={() => setMenuOpen(false)}>
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link href="/about" className="block rounded-lg px-3 py-2 hover:bg-surface2/70" onClick={() => setMenuOpen(false)}>
                        About
                      </Link>
                    </li>
                    <li>
                      <Link href="/privacy" className="block rounded-lg px-3 py-2 hover:bg-surface2/70" onClick={() => setMenuOpen(false)}>
                        Privacy
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ---------- Settings Modal ---------- */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onMouseDown={() => setSettingsOpen(false)}>
          <div
            className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-text shadow-card"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Settings</h3>
              <button className="btn-ghost px-2 py-1 text-sm" onClick={() => setSettingsOpen(false)}>Close</button>
            </div>

            {settingsMsg && (
              <div className="mb-3 rounded-xl border border-border bg-surface2/70 px-3 py-2 text-sm">
                {settingsMsg}
              </div>
            )}

            <div className="space-y-3">
              <button className="btn-ghost w-full" onClick={sendPasswordReset}>
                Change password (email reset)
              </button>

              {!confirmClear ? (
                <button className="btn-ghost w-full text-red-300 hover:bg-red-400/10" onClick={() => setConfirmClear(true)}>
                  Clear data…
                </button>
              ) : (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                  <div className="mb-2 text-sm">
                    Are you sure you want to delete your data? This cannot be undone.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-ghost"
                      onClick={() => setConfirmClear(false)}
                      disabled={clearing}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn text-red-300 hover:bg-red-400/10"
                      onClick={clearAccountData}
                      disabled={clearing}
                    >
                      {clearing ? "Deleting…" : "Yes, delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

