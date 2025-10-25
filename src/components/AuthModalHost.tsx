// src/components/AuthModalHost.tsx
"use client";

/**
 * Legacy Supabase auth modal placeholder.
 * We’ve migrated to OnboardingModalHost (ID-based flow),
 * so this renders nothing but keeps any old imports harmless.
 *
 * Bonus: if some old code dispatches `auth:open`, we translate it
 * into the new onboarding modal open event.
 */
export default function AuthModalHost() {
  // Translate legacy open events to the new onboarding modal (optional)
  if (typeof window !== "undefined") {
    const handler = () =>
      window.dispatchEvent(new CustomEvent("onboard:open", { detail: { tab: "create" } }));
    window.addEventListener("auth:open", handler);
    return () => window.removeEventListener("auth:open", handler);
  }
  return null;
}
