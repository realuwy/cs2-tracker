"use client";
import { useEffect, useState } from "react";

export function useEmail() {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  async function refresh() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data: { email: string | null } = await res.json();
      setEmail(data?.email ?? null);
    } catch {
      setEmail(null);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => { setChecking(true); refresh(); }, []);
  useEffect(() => {
    const onChanged = () => refresh();
    window.addEventListener("auth:changed", onChanged);
    window.addEventListener("focus", onChanged);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refresh();
    });
    return () => window.removeEventListener("auth:changed", onChanged);
  }, []);

  return { email, checking, refresh };
}
