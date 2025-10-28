"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

export default function GetStartedButton({
  className = "btn-accent",
}: {
  className?: string;
}) {
  const router = useRouter();

  const onClick = useCallback(() => {
    router.push("/login"); // email sign-in page
  }, [router]);

  return (
    <button type="button" className={className} onClick={onClick}>
      Get Started
    </button>
  );
}


