"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AccountMenu from "@/components/AccountMenu";
import { upsertAccountRows } from "@/lib/rows";

export default function AppHeader() {
  const pathname = usePathname();
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<{ name?: string | null; email?: string | null; avatarUrl?: string | null } | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user ?? null;
      setUser(
        u
          ? { name: u.user_metadata?.name ?? null, email: u.email ?? null, avatarUrl: u.user_metadata?.avatar_url ?? null }
          : null
      );
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        const su = s?.user ?? null;
        setUser(
          su
            ? { name: su.user_metadata?.name ?? null, email: su.email ?? null, avatarUrl: su.user_metadata?.avatar_url ?? null }
            : null
        );
      });
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => unsub?.();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface2/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-3 sm:px-4 py-3">
        {/* Brand */}
        <div className="justify-self-start flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-accent" />
          <Link href="/" className="text-sm font-semibold text-text/85 hover:text-text">
            CS2 Tracker
          </Link>
        </div>

        {/* Center nav */}
        <div className="justify-self-center hidden sm:block">
          <Link
            href="/dashboard"
            className={`rounded-md px-2 py-1 text-sm ${
              pathname === "/dashboard" ? "text-accent" : "text-muted hover:text-text"
            }`}
          >
            Dashboard
          </Link>
        </div>

        {/* Right account */}
        <div className="justify-self-end">
          <AccountMenu
            user={user}
            onOpenAuth={() => setShowAuth(true)}
            onClearLocal={async () => {
              try {
                const cache = JSON.parse(localStorage.getItem("cs2:dashboard:rows") || "[]");
                await upsertAccountRows(cache);
              } catch {}
              try {
                localStorage.removeItem("cs2:dashboard:rows");
                localStorage.removeItem("cs2:dashboard:rows:updatedAt");
              } catch {}
              try {
                await supabase.auth.signOut();
              } finally {
                location.href = "/";
              }
            }}
          />
        </div>
      </nav>

      {showAuth && (
        // Lazy import pattern was used before; if not using, this is fine.
        // The modal itself already follows the theme.
        <></>
      )}
    </header>
  );
}
