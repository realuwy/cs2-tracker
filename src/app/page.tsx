"use client";

import { useState } from "react";
import AuthModal from "@/components/auth-modal";

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg text-text">
      {/* Hero */}
      <section className="hero-violet mx-auto max-w-5xl px-6 pt-20 pb-10 text-center">
        {/* small badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft/60 px-3 py-1 text-xs text-muted ring-1 ring-border">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          ALPHA
        </div>

        <h1 className="mt-6 font-display text-4xl sm:text-5xl font-extrabold leading-tight tracking-[-0.02em]">
          Take control of your
          <br />
          <span className="text-accent">CS2 Item Portfolio</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-balance text-muted">
          Track your CS2 skins across Steam inventory and storage units. Add items manually, see
          up-to-date prices, and watch your portfolio value move in real-time.
        </p>

        <div className="mt-8 flex items-center justify-center">
  <button
    onClick={() => setShowModal(true)}
    className="rounded-full bg-indigo-500 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-400"
  >
    Get started
  </button>
</div>


        {/* Preview frame */}
        <div className="mx-auto mt-12 w-full max-w-5xl rounded-2xl border border-border bg-surface/70 p-2 shadow-card">
          <div className="h-72 w-full rounded-xl bg-surface ring-1 ring-border" />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 pb-20 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="mb-2 font-medium text-accent">⏱ Real-time pricing</div>
          <p className="text-sm text-muted">
            Live prices (Steam/Skinport) with sensible caching. If no current price exists, last
            sold is used until updated.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="mb-2 font-medium text-accent">📊 Portfolio analytics</div>
          <p className="text-sm text-muted">
            Total value, P/L, and % change over 1h / 24h / 30d. Filter by exterior, rarity, and
            more.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="mb-2 font-medium text-accent">🧰 Manual storage items</div>
          <p className="text-sm text-muted">
            Add items not in your visible inventory (storage units). Save them to your account or
            browser.
          </p>
        </div>
      </section>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
