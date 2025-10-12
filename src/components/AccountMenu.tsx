"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type UserLite = { email?: string | null; name?: string | null; avatarUrl?: string | null };

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserLite | null>(null);
  const [guest, setGuest] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  // session (supabase) + guest flag
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user ?? null;
      setUser(u ? { email: u.email, name: u.user_metadata?.name, avatarUrl: u.user_metadata?.avatar_url } : null);
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        const su = s?.user ?? null;
        setUser(su ? { email: su.email, name: su.user_metadata?.name, avatarUrl: su.user_metadata?.avatar_url } : null);
      });
      unsub = () => sub.subscription.unsubscribe();
    })();

    const readGuest = () => setGuest((sessionStorage.getItem("auth_mode") ?? "") === "guest");
    readGuest();
    window.addEventListener("storage", readGuest);
    return () => {
      window.removeEventListener("storage", readGuest);
      unsub?.();
    };
  }, []);

  const label = user ? (user.name || user.email || "Account")
    : guest ? "Guest"
    : "Account";

  const initial = user
    ? (user.name?.[0] || user.email?.[0] || "U").toUpperCase()
    : guest ? "G"
    : "A";

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-600 text-xs font-bold text-black">
          {initial}
        </span>
        <span>{label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-70">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-900 p-1 shadow-lg">
          {!user && !guest && (
            <button
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new CustomEvent("open-auth")); // your modal opener
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800"
            >
              Log in / Sign up
            </button>
          )}

          {!user && guest && (
            <button
              onClick={() => {
                sessionStorage.removeItem("auth_mode");
                setGuest(false);
                setOpen(false);
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800"
            >
              Leave guest mode
            </button>
          )}

          {user && (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setOpen(false);
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800"
            >
              Log out
            </button>
          )}

          <button
            onClick={() => {
              try { localStorage.removeItem("cs2:dashboard:rows"); } catch {}
              location.reload();
            }}
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800"
          >
            Clear local data
          </button>
        </div>
      )}
    </div>
  );
}
