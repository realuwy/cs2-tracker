export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold">Your Portfolio</h1>
      <p className="mt-2 text-white/70">
        This is where your synced Steam items and manual storage items will appear with pricing,
        totals, and % change. We’ll wire this next.
      </p>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <div className="text-sm text-white/60">No items yet. Use “Import” or “Storage” to add.</div>
      </div>
    </main>
  );
}

