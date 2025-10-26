// src/components/auth-modal.tsx
"use client";

/**
 * Legacy Supabase auth modal (removed).
 * We keep this stub so any old imports won’t break the build.
 * The new flow uses OnboardingModalHost (ID-based).
 */
export default function LegacyAuthModal() {
  return null;
}

// Optional helper so old code that tried to "open" the auth modal doesn’t explode.
// It now just opens the new onboarding modal instead.
export function openAuthModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("onboard:open", { detail: { tab: "create" } }));
  }
}
