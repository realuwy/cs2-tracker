// src/components/auth-modal.tsx
"use client";

/**
 * Legacy Auth modal (Supabase) — shimmed out.
 * We now use the ID-based Onboarding flow instead.
 * If any code still triggers this modal, we forward to the new onboarding.
 */

import { useEffect } from "react";

export default function AuthModal() {
  // If something tries to open the old auth modal, open the new onboarding instead.
  useEffect(() => {
    const open = () =>
      window.dispatchEvent(new CustomEvent("onboard:open", { detail: { tab: "create" } }));
    window.addEventListener("auth:open", open);
    return () => window.removeEventListener("auth:open", open);
  }, []);

  // Nothing to render; this is just a compatibility layer.
  return null;
}
