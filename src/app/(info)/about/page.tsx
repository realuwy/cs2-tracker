import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10 text-slate-200">
      <h1 className="text-3xl font-bold tracking-tight">About CS2 Tracker</h1>

      <p className="mt-3 text-slate-400">
        CS2 Tracker helps you keep a clean, private list of your CS2 items and see rough
        market values at a glance. It’s fast, minimal, and privacy-minded.
      </p>

      <div className="mt-8 space-y-8">
        {/* Features */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold">Key features</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
            <li>Dashboard table with item name + metadata pills (Wear, Pattern, Float).</li>
            <li>Type-ahead add: search items by name and add quickly.</li>
            <li>
              Pricing from Skinport/Steam where available with sensible sanity checks.
            </li>
            <li>
              Save data to your account <span className="text-slate-400">(Supabase)</span> or use
              local browser storage as a guest.
            </li>
            <li>Inline edit panel: tweak quantity, wear, float, and pattern.</li>
          </ul>
        </section>

        {/* Pricing notes */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold">How pricing works</h2>
          <p className="mt-3 text-slate-300">
            Prices are approximate and for convenience only. Matching is based on
            <span className="font-medium"> item name + wear</span>; Float and Pattern are
            informational. Steam prices are checked against Skinport ranges to avoid
            outliers.
          </p>
        </section>

        {/* Data model */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold">Local-first design</h2>
          <p className="mt-3 text-slate-300">
            As a guest, your rows live in <code className="rounded bg-slate-800/80 px-1.5 py-0.5">localStorage</code>{" "}
            under <code className="rounded bg-slate-800/80 px-1.5 py-0.5">cs2:dashboard:rows</code>. Clearing browser data resets the app.
            When signed in, your rows are synced to your account so they follow you between devices.
          </p>
        </section>

        {/* Roadmap */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold">Roadmap (short)</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
            <li>Filters &amp; sorting polish and mobile-first improvements.</li>
            <li>Bulk edit and tagging.</li>
            <li>Optional import/export of saved rows.</li>
          </ul>
        </section>

        {/* CTA row */}
        <div className="flex items-center justify-end">
          <Link
            href="/privacy"
            className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            Privacy
          </Link>
        </div>
      </div>
    </main>
  );
}

