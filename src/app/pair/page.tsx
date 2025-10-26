"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic"; // avoid prerender errors for CSR page

function PairContent() {
  const params = useSearchParams();
  const router = useRouter();
  const code = params.get("code") || "";
  const [msg, setMsg] = useState("Preparing…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!code) {
        setMsg("Invalid QR link.");
        return;
      }
      setMsg("Linking your device…");

      try {
        const res = await fetch("/api/pair/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();

        if (!res.ok) {
          setMsg(data?.error || "Could not claim code.");
          return;
        }

        localStorage.setItem("cs2:id", data.id);
        window.dispatchEvent(new Event("id:changed"));

        setMsg("Linked! Redirecting to your dashboard…");
        if (!cancelled) setTimeout(() => router.replace("/dashboard"), 600);
      } catch {
        setMsg("Network error. Try rescanning.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold">Open on Phone</h1>
      <p className="text-zinc-300">{msg}</p>
      <p className="text-xs text-zinc-500">If this takes too long, close and rescan the QR.</p>
    </div>
  );
}

export default function PairPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center p-6 text-zinc-300">
        Loading…
      </div>
    }>
      <PairContent />
    </Suspense>
  );
}

