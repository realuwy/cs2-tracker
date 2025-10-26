"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { getExistingId } from "@/lib/id";

export default function GetStartedButton({
  className = "btn-accent",
}: {
  className?: string;
}) {
  const router = useRouter();

  const onClick = useCallback(() => {
    // Ensure an ID exists (creates one if missing)
    const userId = getExistingId();

    // Broadcast for any listeners (dashboard picks this up)
    try {
      window.dispatchEvent(
        new CustomEvent("id:changed", { detail: { userId } })
      );
    } catch {}

    router.push("/dashboard");
  }, [router]);

  return (
    <button type="button" className={className} onClick={onClick}>
      Get Started
    </button>
  );
}
export { getExistingId as getUserId };
