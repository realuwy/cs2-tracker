"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";


export function SiteHeader() {
  const pathname = usePathname();
  const [auth, setAuth] = useState<"guest" | "user" | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const isGuest = typeof window !== "undefined" && sessionStorage.getItem("auth_mode") === "guest";
    const email = typeof window !== "undefined" ? localStorage.getItem("current_user") : null;
    setAuth(isGuest ? "guest" : email ? "user" : null);

    if (email) {
      try {
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        const u = users.find((x: any) => x.email === email);
        setUsername(u?.username || email);
      } catch {}
    }
  }, [pathname]);

  const linkClass = (href: string) =>
    `px-3 py-1.5 rounded-full text-sm transition ${
      pathname.startsWith(href) ? "text-white bg-white/10" : "text-white/70 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center px-4">
        {/* Left logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded bg-amber-400" />
          <span className="text-sm font-semibold">CS2 Tracker</span>
        </Link>

        {/* Center nav */}
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
          </Link>
        </nav>

        {/* Right account */}
        <div className="ml-auto">
          {auth === "user" ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-white/70 sm:inline">Hi, {username}</span>
              <button
                onClick={() => {
                  localStorage.removeItem("current_user");
                  localStorage.removeItem("auth_mode");
                  window.location.href = "/";
                }}
                className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
            >
              Account
            </button>
          )}
        </div>
      </div>

     
    </header>
  );
}

