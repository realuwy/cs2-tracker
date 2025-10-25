// src/components/GetStartedButton.tsx
"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUserId } from "@/lib/id";

export default function GetStartedButton({
  className = "btn-accent",
  children = "Get Started",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();

  const onClick = useCallback(() => {
    const id = getUserId();
    if (id) {
      router.push("/dashboard");
    } else {
      // open the ID onboarding modal
      window.dispatchEvent(new CustomEvent("onboard:open", { detail: { tab: "create" } }));
    }
  }, [router]);

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
