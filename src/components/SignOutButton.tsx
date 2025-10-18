"use client";

import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

export default function SignOutButton({
  className = "rounded-lg border border-border bg-surface2 px-3 py-2 hover:bg-surface",
  children = "Sign Out",
}: { className?: string; children?: React.ReactNode }) {
  const supabase = getSupabaseClient();
  const router = useRouter();

  return (
    <button
      className={className}
      onClick={async () => {
        await supabase.auth.signOut();
        // behaves like a fresh visitor
        router.push("/login");
        router.refresh();
      }}
    >
      {children}
    </button>
  );
}
