// src/app/import/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportPage() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    const tick = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    const to = setTimeout(() => {
      router.replace("/dashboard?notice=import");
    }, 1200);

    return () => {
      clearInterval(tick);
      clearTimeout(to);
    };
  }, [router]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold">Steam import is temporarily disabled</h1>
      <p className="mt-2 text-muted">
        We’ve seen reliability issues with the Steam API. In the meantime, you can add items manually — it’s fast and
        reliable. Your data stays local (guest) or syncs to your account if you’re signed in.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="btn-accent"
          onClick={() => router.replace("/dashboard?notice=import")}
        >
          Open Dashboard
        </button>
        <button className="btn-ghost" onClick={() => router.back()}>
          Go back
        </button>
      </div>

      <p className="mt-4 text-xs text-muted">
        Redirecting to your dashboard in {seconds}s…
      </p>
    </main>
  );
}

