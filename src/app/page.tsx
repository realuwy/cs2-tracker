"use client";

import { useState } from "react";
import AuthModal from "@/components/auth-modal";

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[radial-gradient(60%_80%_at_50%_-10%,#171a22_0%,transparent_60%),linear-gradient(#0b0b0f,#0b0b0f)] text-white">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10">
          <span className="inline-block h-2 w-2 rounded-full bg-violet-400" />
          ALPHA
        </div>

        <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl">
          Take control of your
          <br />
          <span className="bg-gradient-to-r from-violet-300 to-indigo-400 bg-clip-text text-transparent">
            CS2 Item Portfolio
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-balance text-slate-300/80">
          Track your CS2 skins across Steam inventory and storage units. Add items manually, see up-to-date prices, and watch your portfolio value move in real-time.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="rounded-full bg-violet-600 px-5 py-2.5 font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition hover:bg-violet-500"
          >
            Get started
          </button>
        </div>

        {/* Mock preview frame */}
        <div className="mx-auto mt-12 w-full max-w-5xl rounded-2xl border border-white/10 bg-black/40 p-2 shadow-2xl">
          <div className="h-72 w-full rounded-xl bg-[linear-gradient(180deg,#0f1014,#0b0b0f)] ring-1 ring-white/10" />
        </div>
      </section>

      {/* Features — centered card content & titles */}
      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 pb-20 sm:grid-cols-3">
        {/* Card 1 */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center shadow-[0_0_30px_-20px_rgba(124,58,237,0.35)]">
          <h3 className="mb-2 font-semibold text-violet-300">Real-time pricing</h3>
          <p className="text-sm text-slate-300/80">
            Live prices (Steam / Skinport) with sensible caching. If no current price exists, last sold is used until updated.
          </p>
        </div>

        {/* Card 2 */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center shadow-[0_0_30px_-20px_rgba(124,58,237,0.35)]">
          <h3 className="mb-2 font-semibold text-violet-300">Portfolio analytics</h3>
          <p className="text-sm text-slate-300/80">
            Total value, P/L, and % change over 1h / 24h / 30d. Filter by exterior, rarity, and more.
          </p>
        </div>

        {/* Card 3 */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center shadow-[0_0_30px_-20px_rgba(124,58,237,0.35)]">
          <h3 className="mb-2 font-semibold text-violet-300">Manual storage items</h3>
          <p className="text-sm text-slate-300/80">
            Add items not in your visible inventory (storage units). Save them to your account or browser.
          </p>
        </div>
      </section>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
