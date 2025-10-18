"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

type Props = {
  children?: React.ReactNode;
  className?: string;
};

/**
 * Behaviour:
 * - If already signed in → go straight to /dashboard
 * - If not signed in → opens the auth modal (sign in / sign up / continue as guest)
 */
export default function GetStartedButton({ children = "Get Started", className = "" }: Props) {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        router.push("/dashboard");
        return;
      }

      // Open the auth modal (AuthModalHost listens for this)
      // Default to the "sign in" view; user can switch to sign up or continue as guest.
      window.dispatchEvent(
        new CustomEvent("auth:open", { detail: { view: "signIn" as const } })
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={[
        "inline-flex items-center justify-center rounded-xl px-5 h-12",
        "bg-accent text-black font-semibold shadow-[0_0_20px_rgba(173,255,47,0.25)]",
        "hover:brightness-110 active:translate-y-[1px] transition",
        "disabled:opacity-60",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
