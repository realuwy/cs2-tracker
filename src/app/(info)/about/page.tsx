import Link from "next/link";

export const metadata = {
  title: "About · CS2 Tracker",
  description: "What CS2 Tracker is, how it works, and what’s coming next.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Top link (only to Privacy) */}
      <div className="mb-6 flex items-center justify-end">
        <Link
          href="/privacy"
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-black hover:bg-amber-500"
        >
          Privacy →
        </Link>
      </div>

      <h1 className="mb-3 text-2xl font-semibold">About CS2 Tracker</h1>
      <p className="mb-8 text-zinc-400">
        CS2 Tracker helps you keep a clean list of your CS2 items and see rough market values at a
        glance. It’s fast, minimal, and local-first.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="mb-2 text-xl font-medium">Key features</h2>
          <ul className="list-inside list-disc text-zinc-300">
            <li><span className="font-medium">Dashboard table</span> with item name + metadata pills (Wear, Pattern, Float).</li>
            <li><span className="font-medium">Type-ahead add</span>: search items by name and add quickly.</li>
            <li><span className="font-medium">Pricing</span>: estimates from Skinport/Steam where available.</li>
            <li><span className="font-medium">Local-first</span>: your inventory rows live in your browser, not on our server.</li>
            <li><span className="font-medium">Edit mini-panel</span>: tweak quantity, wear, float, and pattern inline.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-medium">How pricing works</h2>
          <p className="text-zinc-300">
            Prices are approximate and for convenience only. We match by <span className="font-medium">Item + Wear</span>.
            Float and Pattern are informational. Steam prices are sanity-checked against Skinport ranges.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-medium">Local-first design</h2>
          <p className="text-zinc-300">
            We store your rows in <code className="rounded bg-zinc-900 px-1">localStorage</code> under{" "}
            <code className="rounded bg-zinc-900 px-1">cs2:dashboard:rows</code>. Clearing browser data resets the app.
            You can import again any time.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-medium">Roadmap (short)</h2>
          <ul className="list-inside list-disc text-zinc-300">
            <li>Filters & sorting polish (mobile-first improvements).</li>
            <li>Bulk edit and tagging.</li>
            <li>Optional export/import of saved rows.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-medium">Open source</h2>
          <p className="text-zinc-300">
            Repo:{" "}
            <a className="underline" href="https://github.com/realuwy/cs2-tracker" target="_blank">
              realuwy/cs2-tracker
            </a>. Contributions and issues are welcome.
          </p>
        </section>
      </div>

      {/* Bottom link (only to Privacy) */}
      <div className="mt-10 flex items-center justify-end">
        <Link
          href="/privacy"
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-black hover:bg-amber-500"
        >
          Privacy →
        </Link>
      </div>
    </div>
  );
}
