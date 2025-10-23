"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

/** Small link style for the center-nav */
function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname?.startsWith(href));

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

/** 4-dot icon button used for the user menu (mobile) */
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

  const [sessionName, setSessionName] = useState<SessionName>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isGuest, setIsGuest] = useState<boolean>(
    typeof window !== "undefined" &&
      window.localStorage.getItem("guest_mode") === "true"
  );

  const menuRef = useRef<HTMLDivElement | null>(null);
  const acctRef = useRef<HTMLDivElement | null>(null);

  const authed = !!sessionName;

  // Helpers
  const openSignIn = () =>
    window.dispatchEvent(new CustomEvent("auth:open", { detail: "signin" }));
  const openSignUp = () =>
    window.dispatchEvent(new CustomEvent("auth:open", { detail: "signup" }));
  const openContact = () =>
    window.dispatchEvent(new Event("contact:open"));

  const continueAsGuest = () => {
    try {
      window.localStorage.setItem("guest_mode", "true");
    } catch {}
    setIsGuest(true);
    setAccountOpen(false);
    router.push("/dashboard");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSessionName(null);
    router.push("/");
  };

  // ----- Load supabase session -> show username || email
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
        // If user logs in, clear guest mode
        if (sess?.user) {
          window.localStorage.removeItem("guest_mode");
          setIsGuest(false);
        }
      });

      unsub = () => sub.subscription.unsubscribe();
    })();

    return () => unsub?.();
  }, [supabase]);

  // ----- Click outside to close menus
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

  /* ---------- Render ---------- */

  return (
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
   <button
    type="button"
    onClick={openContact}
    className="relative inline-block bg-transparent p-0 pb-1 text-muted hover:text-text"
  >
    Contact
  </button>
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
              className={[
                "inline-flex items-center gap-2 rounded-lg border border-border bg-surface2/70 px-3 py-1.5 text-sm",
                "hover:bg-surface transition focus:outline-none focus:ring-2 focus:ring-accent/30",
              ].join(" ")}
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
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                className="opacity-70"
              >
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
              <div
                role="menu"
                className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-surface p-2 shadow-xl"
              >
                <div className="px-2 pb-2 pt-1 text-[10px] uppercase tracking-wider text-muted">
                  Account
                </div>

                <div className="px-3 pb-2 text-xs text-muted">
                  {authed ? (
                    <>
                      Signed in as{" "}
                      <span className="text-text">{sessionName}</span>
                    </>
                  ) : isGuest ? (
                    <>
                      Browsing as <span className="text-text">Guest</span>
                    </>
                  ) : (
                    <>Not signed in</>
                  )}
                </div>

                <hr className="my-1 border-border/70" />

                {!authed && (
                  <>
                    <button
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                      onClick={() => {
                        setAccountOpen(false);
                        openSignIn();
                      }}
                    >
                      Sign In
                    </button>
                    <button
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                      onClick={() => {
                        setAccountOpen(false);
                        openSignUp();
                      }}
                    >
                      Create account
                    </button>
                    <button
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                      onClick={continueAsGuest}
                    >
                      Continue as guest
                    </button>
                  </>
                )}

                {authed && (
                  <>
                    <button
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                      onClick={() => {
                        setAccountOpen(false);
                        window.dispatchEvent(new Event("settings:open"));
                      }}
                    >
                      Settings
                    </button>
                    <button
                      role="menuitem"
                      className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-400/10"
                      onClick={() => {
                        setAccountOpen(false);
                        signOut();
                      }}
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Dots menu – visible on mobile only */}
          <div className="relative md:hidden" ref={menuRef}>
            <DotsButton
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
            />

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface p-2 shadow-xl">
                <ul className="space-y-1 text-sm">
                  <li>
                    <Link
                      href="/"
                      className="block rounded-lg px-3 py-2 hover:bg-surface2/70"
                      onClick={() => setMenuOpen(false)}
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard"
                      className="block rounded-lg px-3 py-2 hover:bg-surface2/70"
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className="block rounded-lg px-3 py-2 hover:bg-surface2/70"
                      onClick={() => setMenuOpen(false)}
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy"
                      className="block rounded-lg px-3 py-2 hover:bg-surface2/70"
                      onClick={() => setMenuOpen(false)}
                    >
                      Privacy
                    </Link>
                  </li>
                <li>
 <li>
  <button
    type="button"
    onClick={() => { openContact(); setMenuOpen(false); }}
    className="block w-full text-left rounded-lg px-3 py-2 hover:bg-surface2/70"
  >
    Contact
  </button>
</li>


                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

