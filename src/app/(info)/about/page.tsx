import Link from "next/link";

export const metadata = {
  title: "About · CS2 Tracker",
  description:
    "What CS2 Tracker is, how it works, and why it’s built guest-first with optional account sync.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">About</h1>
        <p className="mt-2 text-muted">
          CS2 Tracker is a fast, privacy-first web app to manage your CS2 items,
          track quantities, and see snapshot prices from Skinport & Steam.
        </p>
      </header>

      <section className="card p-5 mb-6">
        <h2 className="text-lg font-semibold">What it does</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>• Add items manually with wear/notes and quantities.</li>
          <li>• See snapshot values from Steam and Skinport (estimates).</li>
          <li>• Use completely as a <span className="text-text">guest</span>—data stays in your browser.</li>
          <li>• Create an account any time to sync your current local items to the cloud.</li>
          <li>• Clean, responsive UI with a neon-lime theme; works great on mobile.</li>
        </ul>
      </section>

      <section className="card p-5 mb-6">
        <h2 className="text-lg font-semibold">How data is stored</h2>
        <div className="mt-3 text-sm text-muted space-y-3">
          <p>
            <span className="text-text font-medium">Guest mode:</span> items are
            saved to <code className="px-1 rounded bg-white/5">localStorage</code> on your device
            under the keys <code className="px-1 rounded bg-white/5">portfolio_items</code> and{" "}
            <code className="px-1 rounded bg-white/5">guest_mode</code>. Clear them any time from{" "}
            <span className="text-text">Settings → Clear data…</span>
          </p>
          <p>
            <span className="text-text font-medium">Signed-in:</span> your items
            sync to Supabase in a single row per user (table{" "}
            <code className="px-1 rounded bg-white/5">account_rows</code>, JSONB column{" "}
            <code className="px-1 rounded bg-white/5">rows</code>). Row-level security
            (RLS) restricts access to <code className="px-1 rounded bg-white/5">auth.uid()</code>.
          </p>
        </div>
      </section>

      <section className="card p-5 mb-6">
        <h2 className="text-lg font-semibold">Why guest-first?</h2>
        <p className="mt-3 text-sm text-muted">
          You shouldn’t need an account to test a tool. Guest mode lets you try
          everything instantly; if you later sign up or sign in, your local items
          are merged into your account automatically.
        </p>
      </section>

      <section className="card p-5 mb-6">
        <h2 className="text-lg font-semibold">Roadmap (short)</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>• Settings polish (inline reset flow UX, more export options).</li>
          <li>• UI refinements & micro-animations.</li>
          <li>• More robust item parsing helpers.</li>
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p className="mt-3 text-sm text-muted">
          Found a bug or want to request a feature? Open an issue on{" "}
          <Link
            href="https://github.com/realuwy/cs2-tracker/issues"
            className="underline hover:no-underline"
          >
            GitHub
          </Link>
          .
        </p>
      </section>

      <p className="mt-8 text-xs text-muted">Updated: 20 Oct 2025</p>
    </main>
  );
}
