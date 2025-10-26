// src/app/open/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setUserId } from "@/lib/id";

/**
 * We must wrap useSearchParams() usage in <Suspense>.
 */
export default function OpenPage() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <OpenInner />
    </Suspense>
  );
}

function LoadingUI() {
  return (
    <div className="mx-auto max-w-md p-6 text-center">
      <div className="mb-3 text-lg font-semibold">Opening…</div>
      <p className="text-muted">Preparing your session.</p>
    </div>
  );
}

// Keep these keys consistent with the dashboard page
const STORAGE_KEY = "cs2:dashboard:rows";
const STORAGE_TS_KEY = "cs2:dashboard:rows:updatedAt";

function OpenInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [phase, setPhase] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      try {
        // u = userId we encoded into the QR link
        // r = optional return path (defaults to /dashboard)
        const u = params.get("u")?.trim();
        const r = params.get("r")?.trim() || "/dashboard";

        if (!u) {
          setPhase("err");
          setMsg("Missing user ID in link.");
          return;
        }

        // 1) Set the local userId used across the app
        setUserId(u);
        window.dispatchEvent(new CustomEvent("id:changed", { detail: { userId: u } }));

        // 2) Try to hydrate their rows from the server (best effort)
        try {
          const res = await fetch(`/api/rows/get?uid=${encodeURIComponent(u)}`, {
            cache: "no-store",
          });
          if (res.ok) {
            const data = await res.json();
            // Expecting { rows?: any[], ts?: number } from our API
            if (Array.isArray(data?.rows)) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.rows));
            }
            if (typeof data?.ts === "number") {
              localStorage.setItem(STORAGE_TS_KEY, String(data.ts));
            } else {
              localStorage.setItem(STORAGE_TS_KEY, String(Date.now()));
            }
          }
        } catch {
          // ignore — user will still have their ID set
        }

        setPhase("ok");
        setMsg("Linked! Redirecting…");

        // 3) Navigate them in-app
        // Use a tiny delay to ensure localStorage/event have flushed
        setTimeout(() => router.push(r), 350);
      } catch (e) {
        setPhase("err");
        setMsg("Failed to open link.");
      }
    };

    run();
    // We only want to run once on mount for the current URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-md p-6 text-center">
      <div className="mb-3 text-lg font-semibold">
        {phase === "ok" ? "Success" : phase === "err" ? "Oops" : "Opening…"}
      </div>
      <p className="text-muted">{msg || "Preparing your session."}</p>
      {phase === "err" && (
        <p className="mt-3 text-sm text-muted">
          Try scanning a fresh QR from your Account menu, or open{" "}
          <a className="underline" href="/dashboard">
            /dashboard
          </a>
          .
        </p>
      )}
    </div>
  );
}
