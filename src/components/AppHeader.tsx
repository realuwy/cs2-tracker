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
  const [user, setUser] = useState<{name?: string|null; email?: string|null; avatarUrl?: string|null} | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user ?? null;
      setUser(u ? { name: u.user_metadata?.username ?? u.user_metadata?.name ?? null, email: u.email ?? null, avatarUrl: u.user_metadata?.avatar_url ?? null } : null);
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        const su = s?.user ?? null;
        setUser(su ? { name: su.user_metadata?.username ?? su.user_metadata?.name ?? null, email: su?.email ?? null, avatarUrl: su.user_metadata?.avatar_url ?? null } : null);
      });
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => unsub?.();
  }, []);

  const isDash = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-900/60 bg-[#0b0b0f]/80 backdrop-blur">
      <div className="relative mx-auto flex h-14 max-w-6xl items-center px-4">
        {/* Left: brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-400" />
          <span className="text-sm font-semibold text-slate-200">CS2 Tracker</span>
        </Link>

        {/* Center: Dashboard pill (now visible on mobile too) */}
        <nav
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-label="Primary"
        >
          <Link
            href="/dashboard"
            className={[
              "rounded-full px-3 py-1.5 text-sm transition shadow-sm",
              isDash
                ? "bg-violet-600 text-white"
                : "bg-slate-900/70 text-slate-200 hover:bg-slate-800/80 border border-slate-800"
            ].join(" ")}
          >
            Dashboard
          </Link>
        </nav>

        {/* Right: account */}
        <div className="ml-auto">
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
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </header>
  );
}

