"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AccountMenu from "@/components/AccountMenu";
import AuthModal from "@/components/auth-modal";
import { supabase } from "@/lib/supabase";

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
    <header className="sticky top-0 z-40 border-b border-zinc-900/70 bg-black/50 backdrop-blur">
      <nav className="relative mx-auto grid max-w-6xl grid-cols-3 items-center px-4 py-3">
        {/* Left: brand */}
        <div className="justify-self-start flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold text-amber-400">
            ● CS2 Tracker
          </Link>
        </div>

        {/* Center: Dashboard */}
        <div className="justify-self-center hidden sm:block">
          <Link
            href="/dashboard"
            className={`rounded-lg px-2 py-1 text-sm ${
              pathname === "/dashboard"
                ? "text-amber-400"
                : "text-zinc-300 hover:text-zinc-100"
            }`}
          >
            Dashboard
          </Link>
        </div>

        {/* Right: account */}
        <div className="justify-self-end">
          <AccountMenu
            user={user}
            onOpenAuth={() => setShowAuth(true)}
            onClearLocal={() => {
              try {
                localStorage.removeItem("cs2:dashboard:rows");
              } catch {}
              location.reload();
            }}
          />
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </header>
  );
}
