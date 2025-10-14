"use client";

import { useState } from "react";
import AuthModal from "@/components/auth-modal";

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[radial-gradient(60%_80%_at_50%_-10%,#101010_0%,transparent_60%),linear-gradient(var(--bg),var(--bg))] text-[var(--text)]">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--bg)]/70 px-3 py-1 text-xs text-[var(--muted)] ring-1 ring-[var(--border)]">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
          ALPHA
        </div>

        <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl">
          Take control of your
          <br />
          <span className="text-[var(--accent)]">CS2 Item Portfolio</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-balance text-[color:var(--muted)]">
          Track your CS2 skins across Steam inventory and storage units. Add items manually, see up-to-date prices, and watch your portfolio value move in real-time.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            type="button"
            className="btn-primary px-5 py-2.5"
          >
            Get started
          </button>
        </div>

        {/* Mock preview frame */}
        <div className="mx-auto mt-12 w-full max-w-5xl card p-2 shadow-card">
          <div className="h-72 w-full rounded-xl bg-[linear-gradient(180deg,#0f1014,var(--bg))] ring-1 ring-[var(--border)]" />
        </div>
      </section>

      {/* Features — centered card content & titles */}
      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 pb-20 sm:grid-cols-3">
        {/* Card 1 */}
        <div className="card p-5 text-center">
          <h3 className="mb-2 font-semibold" style={{ color: "var(--accent)" }}>
            Real-time pricing
          </h3>
          <p className="text-sm text-[color:var(--muted)]">
            Live prices (Steam / Skinport) with sensible caching. If no current price exists, last sold is used until updated.
          </p>
        </div>

        {/* Card 2 */}
        <div className="card p-5 text-center">
          <h3 className="mb-2 font-semibold" style={{ color: "var(--accent)" }}>
            Portfolio analytics
          </h3>
          <p className="text-sm text-[color:var(--muted)]">
            Total value, P/L, and % change over 1h / 24h / 30d. Filter by exterior, rarity, and more.
          </p>
        </div>

        {/* Card 3 */}
        <div className="card p-5 text-center">
          <h3 className="mb-2 font-semibold" style={{ color: "var(--accent)" }}>
            Manual storage items
          </h3>
          <p className="text-sm text-[color:var(--muted)]">
            Add items not in your visible inventory (storage units). Save them to your account or browser.
          </p>
        </div>
      </section>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
