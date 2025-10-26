// src/components/AppHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUserId, generateUserId, setUserId, clearAllLocalData } from "@/lib/id";

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
function OpenOnPhoneButton() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle"|"pending"|"claimed"|"expired">("idle");
  const [qrText, setQrText] = useState<string>("");

  const id = typeof window !== "undefined" ? localStorage.getItem("cs2:id") : null;

  const begin = async () => {
    if (!id) return;
    setOpen(true);
    setStatus("pending");
    setCode(null);
    try {
      const res = await fetch("/api/pair/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to start");
      const c = data.code as string;
      setCode(c);
      const origin = window.location.origin;
      setQrText(`${origin}/pair?code=${c}`);
    } catch {
      setStatus("expired");
    }
  };

  // Poll status while modal open + we have a code
  useEffect(() => {
    if (!open || !code) return;
    let alive = true;
    const iv = setInterval(async () => {
      if (!alive) return;
      const res = await fetch(`/api/pair/status?code=${code}`);
      const data = await res.json();
      if (data.status === "claimed") {
        setStatus("claimed");
        clearInterval(iv);
      } else if (data.status === "expired") {
        setStatus("expired");
        clearInterval(iv);
      }
    }, 1500);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [open, code]);

  return (
    <>
      <button
        onClick={begin}
        className="w-full rounded-md bg-zinc-800 px-3 py-2 text-left text-sm hover:bg-zinc-700"
      >
        Open on phone (QR)
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-6 text-white shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Scan to continue on phone</h2>
              <button onClick={() => setOpen(false)} className="rounded-md px-2 py-1 text-zinc-300 hover:bg-zinc-800">✕</button>
            </div>

            {qrText ? (
              <div className="flex flex-col items-center gap-3">
                {/* Use your existing QR component; otherwise use a lightweight lib */}
                {/* Example if you already had a QR component: <Qr value={qrText} size={180} /> */}
                <img
                  alt="QR"
                  className="rounded-lg bg-white p-2"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrText)}`}
                  width={220}
                  height={220}
                />
                <p className="text-sm text-zinc-300 break-all">{qrText}</p>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">Generating QR…</p>
            )}

            <div className="mt-4 rounded-lg border border-zinc-800 p-3 text-sm">
              {status === "pending" && <span className="text-amber-300">Waiting for your phone…</span>}
              {status === "claimed" && <span className="text-emerald-400">Connected! You can close this.</span>}
              {status === "expired" && <span className="text-rose-400">Expired. Close and try again.</span>}
            </div>
          </div>
        </div>
      )}
    </>
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

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [userId, setUserIdState] = useState<string | null>(null);

  // QR state
  const [showQr, setShowQr] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const acctRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setUserIdState(getUserId());
  }, []);

  // refresh header ID when route changes
  useEffect(() => {
    setUserIdState(getUserId());
  }, [pathname]);

  // react to ID changes from elsewhere (onboarding, clear, replace)
  useEffect(() => {
    const onChange = (e: any) => {
      setUserIdState(e?.detail?.userId ?? getUserId());
    };
    window.addEventListener("id:changed", onChange);
    return () => window.removeEventListener("id:changed", onChange);
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

  // generate QR when Account menu opens (and userId exists)
  useEffect(() => {
    let mounted = true;
    async function makeQr() {
      if (!accountOpen || !userId) return;
      try {
       const { toDataURL } = await import("qrcode");
const url = await toDataURL(userId, { width: 160, margin: 1 });
        if (mounted) setQrUrl(url);
      } catch {
        if (mounted) setQrUrl(null);
      }
    }
    makeQr();
    return () => { mounted = false; };
  }, [accountOpen, userId]);

  const openOnboarding = (tab?: "create" | "paste" | "recover") =>
    window.dispatchEvent(new CustomEvent("onboard:open", { detail: { tab } }));

  function copyId() {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
  }

  function replaceId() {
    const next = generateUserId();
    setUserId(next);
    setUserIdState(next);
  }

  function resetLocal() {
    clearAllLocalData();
    setUserIdState(null);
    router.push("/");
    openOnboarding("create");
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
              {userId ? (
                <span className="badge badge-accent">ID ready</span>
              ) : (
                <span className="rounded bg-amber-400/15 px-1.5 py-[1px] text-[10px] text-amber-300">
                  New
                </span>
              )}
              <svg viewBox="0 0 24 24" width="14" height="14" className="opacity-70">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {accountOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-surface p-2 shadow-xl">
                <div className="px-2 pb-2 pt-1 text-[10px] uppercase tracking-wider text-muted">Identity</div>

                {userId ? (
                  <div className="px-3 pb-2 text-xs text-muted">
                    Your ID:
                    <div className="mt-1 select-all rounded-lg bg-surface2/70 px-2 py-1 font-mono text-[11px] text-text">
                      {userId}
                    </div>
                  </div>
                ) : (
                  <div className="px-3 pb-2 text-xs text-muted">No ID yet. Generate one to start.</div>
                )}

                <hr className="my-1 border-border/70" />

                {!userId ? (
                  <button
                    role="menuitem"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                    onClick={() => { setAccountOpen(false); openOnboarding("create"); }}
                  >
                    Generate ID
                  </button>
                ) : (
                  <>
                    <button
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                      onClick={copyId}
                    >
                      Copy ID
                    </button>

                    <button
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                      onClick={() => setShowQr((v) => !v)}
                    >
                      {showQr ? "Hide QR" : "Show QR"}
                    </button>

                    {showQr && (
                      <div className="mx-3 mt-2 rounded-lg border border-border bg-surface2/70 p-3 text-center">
                        {qrUrl ? (
                          <>
                            <img
                              src={qrUrl}
                              alt="Your CS2 Tracker ID QR"
                              className="mx-auto rounded-lg border border-border"
                              width={160}
                              height={160}
                            />
                            <div className="mt-2 flex items-center justify-center gap-2">
                              <a
                                href={qrUrl}
                                download="cs2tracker-id.png"
                                className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-surface/60"
                              >
                                Download PNG
                              </a>
                              <button
                                className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-surface/60"
                                onClick={() => navigator.clipboard.writeText(userId!)}
                              >
                                Copy ID text
                              </button>
                            </div>
                            <p className="mt-1 text-[11px] text-muted">Scan to import your ID on another device.</p>
                          </>
                        ) : (
                          <p className="text-xs text-muted">Generating QR…</p>
                        )}
                      </div>
                    )}

                    <button
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                      onClick={replaceId}
                    >
                      Replace ID (new one)
                    </button>
                    <button
                      role="menuitem"
                      className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-400/10"
                      onClick={resetLocal}
                    >
                      Clear local data
                    </button>
                  </>
                )}

                <hr className="my-2 border-border/70" />

                <button
                  role="menuitem"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2/70"
                  onClick={() => { setAccountOpen(false); openOnboarding("recover"); }}
                >
                  Recover ID
                </button>
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
