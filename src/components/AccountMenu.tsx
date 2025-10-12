"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type UserLike = {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
} | null;

type Props = {
  user: UserLike;
  onOpenAuth: () => void;
  onClearLocal: () => void;
};

export default function AccountMenu({ user, onOpenAuth, onClearLocal }: Props) {
  const [mode, setMode] = useState<"none" | "guest" | "user">("none");
  const [open, setOpen] = useState(false);

  // derive visual mode from session + user
  useEffect(() => {
    const derive = () => {
      if (user) return setMode("user");
      const s = sessionStorage.getItem("auth_mode");
      setMode(s === "guest" ? "guest" : "none");
    };
    derive();

    const onChange = () => derive();
    window.addEventListener("auth-mode-change", onChange as any);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("auth-mode-change", onChange as any);
      window.removeEventListener("storage", onChange);
    };
  }, [user]);

  const label =
    user?.email ? user.email : mode === "guest" ? "Guest" : "Account";

  const initial =
    (user?.name?.[0] || user?.email?.[0] || (mode === "guest" ? "G" : "A"))
      ?.toUpperCase() ?? "A";

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } finally {
      sessionStorage.removeItem("auth_mode");
      window.dispatchEvent(new CustomEvent("auth-mode-change"));
      setOpen(false);
    }
  }

  function handleTrigger() {
    if (mode === "none") {
      onOpenAuth();
    } else {
      setOpen((v) => !v);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleTrigger}
        className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 border border-zinc-700 hover:bg-zinc-800"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-black text-xs font-bold">
          {initial}
        </span>
        {label}
        <svg className="ml-1 h-4 w-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-xl">
          {mode === "none" && (
            <button
              onClick={() => { onOpenAuth(); setOpen(false); }}
              className="w-full rounded-md px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800"
            >
              Sign in / Create account
            </button>
          )}

          {mode === "guest" && (
            <button
              onClick={() => { onOpenAuth(); setOpen(false); }}
              className="w-full rounded-md px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800"
            >
              Sign in
            </button>
          )}

          {mode === "user" && (
            <button
              onClick={signOut}
              className="w-full rounded-md px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800"
            >
              Log out
            </button>
          )}

          <button
            onClick={() => { onClearLocal(); setOpen(false); }}
            className="w-full rounded-md px-3 py-2 text-left text-zinc-200 hover:bg-zinc-800"
          >
            Clear local data
          </button>
        </div>
      )}
    </div>
  );
}
