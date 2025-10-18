"use client";

import { useState } from "react";
import AuthModal from "@/components/auth-modal";
import Faq from "@/components/Faq";

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <main className="min-h-[calc(100vh-64px)] text-text bg-[radial-gradient(60%_80%_at_50%_-10%,rgba(216,255,53,0.06)_0%,transparent_60%),linear-gradient(#0a0a0a,#0a0a0a)]">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-surface/70 px-3 py-1 text-xs text-muted ring-1 ring-border">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          ALPHA
        </div>

        <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl">
          Track and value your
          <br />
          <span className="bg-gradient-to-r from-accent to-white/90 bg-clip-text text-transparent">
            CS2 item portfolio
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-balance text-muted">
          Add items manually or import from Steam. See live Skinport/Steam prices and watch
          your portfolio value update in real-time.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            type="button"
            className="btn-accent"
          >
            Get started
          </button>
        </div>

        {/* Mock preview frame */}
        <div className="mx-auto mt-12 w-full max-w-5xl rounded-2xl border border-border bg-surface p-2 shadow-neon">
          <div className="h-72 w-full rounded-xl bg-[linear-gradient(180deg,#0f1014,#0a0a0a)] ring-1 ring-border" />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 pb-20 sm:grid-cols-3">
        <div className="card p-5 text-center shadow-neon">
          <h3 className="mb-2 font-semibold text-accent">Real-time pricing</h3>
          <p className="text-sm text-muted">
            Live prices (Steam / Skinport) with sensible caching. If no current price exists, last
            sold is used until updated.
          </p>
        </div>

        <div className="card p-5 text-center shadow-neon">
          <h3 className="mb-2 font-semibold text-accent">Portfolio analytics</h3>
          <p className="text-sm text-muted">
            Total value, P/L, and % change over 1h / 24h / 30d. Filter by exterior, rarity, and more.
          </p>
        </div>

        <div className="card p-5 text-center shadow-neon">
          <h3 className="mb-2 font-semibold text-accent">Manual storage items</h3>
          <p className="text-sm text-muted">
            Add items not in your visible inventory (storage units). Save them to your account or browser.
          </p>
        </div>
      </section>
<div className="mt-16 md:mt-24" />
<Faq />
<div className="mt-16" />
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
