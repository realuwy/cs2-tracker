// src/app/open/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { setUserId } from "@/lib/id";

export const dynamic = "force-dynamic";

export default function OpenOnPhonePage() {
  const params = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ok" | "invalid">("loading");

  useEffect(() => {
    const id = params.get("id")?.trim();
    if (!id || id.length < 8) {
      setState("invalid");
      return;
    }

    try {
      setUserId(id);
      // let header / others know immediately
      window.dispatchEvent(new CustomEvent("id:changed", { detail: { userId: id } }));
      setState("ok");
      router.replace("/dashboard");
    } catch {
      setState("invalid");
    }
  }, [params, router]);

  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="mb-2 text-3xl font-bold">Open on Phone</h1>
      {state === "loading" && <p>Linking your ID…</p>}
      {state === "ok" && <p>Linked! Redirecting…</p>}
      {state === "invalid" && <p>Invalid link.</p>}
      <p className="mt-6 text-sm text-muted">
        If this takes too long, close and rescan the QR.
      </p>
    </div>
  );
}
