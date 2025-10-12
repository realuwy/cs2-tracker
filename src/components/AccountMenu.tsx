"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
// ...
<button
  onClick={async () => { await supabase.auth.signOut(); }}
  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900"
>
  <IconLogout /> Log out
</button>


export type AccountMenuProps = {
  /** null/undefined = guest */
  user?: { name?: string | null; email?: string | null; avatarUrl?: string | null } | null;
  onOpenAuth?: () => void;          // open your existing auth modal
  onClearLocal?: () => void;        // clear local guest data
};

export default function AccountMenu({ user, onOpenAuth, onClearLocal }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // close on outside click/escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const isGuest = !user?.email;
  const initials =
    user?.name?.trim()?.[0]?.toUpperCase() ??
    user?.email?.trim()?.[0]?.toUpperCase() ??
    "G";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-black">
          {initials}
        </div>
        <span className="hidden sm:inline">{isGuest ? "Guest" : "Account"}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl shadow-black/40">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-zinc-800 p-3">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full border border-zinc-800 object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 font-bold text-black">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate font-medium text-zinc-100">
                {isGuest ? "Guest" : user?.name || "User"}
              </div>
              <div className="truncate text-xs text-zinc-400">
                {isGuest ? "Local session" : user?.email}
              </div>
            </div>
          </div>

          {/* Actions */}
          <nav className="p-2 text-sm">
            {isGuest ? (
              <button
                onClick={() => { setOpen(false); onOpenAuth?.(); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900"
              >
                <IconLogin /> Log in / Sign up
              </button>
            ) : (
              <Link
                href="/account"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-200 hover:bg-zinc-900"
                onClick={() => setOpen(false)}
              >
                <IconUser /> Account
              </Link>
            )}

            <Link
              href="/about"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              <IconInfo /> About
            </Link>

            <Link
              href="/privacy"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              <IconShield /> Privacy
            </Link>

            <a
              href="https://github.com/realuwy/cs2-tracker"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              <IconGithub /> GitHub
            </a>

            <button
              onClick={() => { setOpen(false); onClearLocal?.(); }}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-300 hover:bg-red-950/30"
            >
              <IconTrash /> Clear local data
            </button>

            {!isGuest && (
              <button
                onClick={() => { setOpen(false); onOpenAuth?.(); }}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900"
              >
                <IconLogout /> Log out
              </button>
            )}
          </nav>

          <div className="border-t border-zinc-800 px-3 py-2 text-[11px] text-zinc-500">
            v0.1 alpha
          </div>
        </div>
      )}
    </div>
  );
}

/* --- tiny inline icons (lucide-like) --- */
function IconUser(){return(<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm7 9a7 7 0 0 0-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
function IconInfo(){return(<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8h.01M12 12v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>)}
function IconShield(){return(<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>)}
function IconGithub(){return(<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.74-1.34-1.74-1.1-.76.08-.74.08-.74 1.22.08 1.86 1.25 1.86 1.25 1.08 1.85 2.84 1.32 3.53 1.01.11-.79.42-1.32.76-1.62-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.24-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.85 1.24 1.92 1.24 3.24 0 4.63-2.8 5.66-5.47 5.96.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58A12 12 0 0 0 12 .5Z"/></svg>)}
function IconTrash(){return(<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>)}
function IconLogin(){return(<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2"/><path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
function IconLogout(){return(<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2"/><path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
