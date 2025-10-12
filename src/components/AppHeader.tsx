"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";            
import AccountMenu from "@/components/AccountMenu";  
import AuthModal from "@/components/auth-modal";    

export default function AppHeader() {
  const pathname = usePathname();
  const [showAuth, setShowAuth] = useState(false);
  const active = (href: string) =>
    pathname === href ? "text-amber-400" : "text-zinc-300 hover:text-zinc-100";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/70 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-sm font-medium text-zinc-200">CS2 Tracker</span>
          <span className="ml-2 rounded-full border border-amber-600/40 bg-amber-600/15 px-1.5 py-0.5 text-[10px] text-amber-400">
            ALPHA
          </span>
        </Link>

        {/* Core nav (Dashboard only) */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/dashboard" className={`text-sm ${active("/dashboard")}`}>
            Dashboard
          </Link>
        </nav>

        {/* Right side (Account dropdown) */}
<div className="flex items-center gap-2">
  <AccountMenu
    user={null}                 // null = guest -> shows "G"
    onOpenAuth={() => setShowAuth(true)}
    onClearLocal={() => {
      try { localStorage.removeItem("cs2:dashboard:rows"); } catch {}
      location.reload();
    }}
  />
</div>

      </div>
   {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
 </header>
  );
}
