export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-[radial-gradient(60%_80%_at_50%_-10%,#1f2937_0%,transparent_60%),linear-gradient(#0b0b0b,#0b0b0b)] text-white">
      {/* Top hero */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
          ALPHA
        </div>

        <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl">
          Take control of your<br />
          <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            CS2 Item Portfolio
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-balance text-white/70">
          Track your CS2 skins across Steam inventory and storage units. Add items manually, see
          up-to-date prices, and watch your portfolio value move in real-time.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <a
            href="/dashboard"
            className="rounded-full bg-amber-500 px-5 py-2.5 font-semibold text-black transition hover:bg-amber-400"
          >
            Get started
          </a>
          <a
            href="/import"
            className="rounded-full px-5 py-2.5 font-semibold text-white/80 ring-1 ring-white/15 transition hover:bg-white/5"
          >
            Import inventory
          </a>
        </div>

        {/* Mock preview frame (replace with real screenshot later) */}
        <div className="mx-auto mt-12 w-full max-w-5xl rounded-2xl border border-white/10 bg-black/40 p-2 shadow-2xl">
          <div className="h-72 w-full rounded-xl bg-[linear-gradient(180deg,#0f0f10,#0b0b0b)] ring-1 ring-white/10" />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 pb-20 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-2 text-amber-400">⏱ Real-time pricing</div>
          <p className="text-sm text-white/70">
            Live prices (Steam/Skinport) with sensible caching. If no current price exists, last
            sold is used until updated.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-2 text-amber-400">📊 Portfolio analytics</div>
          <p className="text-sm text-white/70">
            Total value, P/L, and % change over 1h / 24h / 30d. Filter by exterior, rarity, and
            more.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-2 text-amber-400">🧰 Manual storage items</div>
          <p className="text-sm text-white/70">
            Add items not in your visible inventory (storage units). Save them to your account or
            browser.
          </p>
        </div>
      </section>
    </main>
  );
}
