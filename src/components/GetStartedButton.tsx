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
    const userId = getExistingId();
    try {
      window.dispatchEvent(new CustomEvent("id:changed", { detail: { userId } }));
    } catch {}
    router.push("/dashboard");
  }, [router]);

  return (
    <button type="button" className={className} onClick={onClick}>
      Get Started
    </button>
  );
}


