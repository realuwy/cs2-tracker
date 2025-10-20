import Link from "next/link";

export const metadata = {
  title: "Privacy · CS2 Tracker",
  description:
    "Plain-language privacy for CS2 Tracker: what we store, how we use it, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Privacy</h1>
        <p className="mt-2 text-muted">
          CS2 Tracker is designed to be useful without an account. When you do
          sign in, we keep things minimal and transparent.
        </p>
      </header>

      <section className="card p-5 mb-6">
        <h2 className="text-lg font-semibold">Summary</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>• You can fully use the app as a guest; data stays on your device.</li>
          <li>• If you create an account, your items are stored in Supabase under your user only.</li>
          <li>• We do not sell your data. No ad trackers.</li>
          <li>• Lightweight metrics use Vercel Analytics/Speed Insights to improve performance.</li>
        </ul>
      </section>

      <section className="card p-5 mb-6">
        <h2 className="text-lg font-semibold">Data we store</h2>
        <div className="mt-3 text-sm text-muted space-y-3">
          <p>
            <span className="text-text font-medium">Guest data:</span>{" "}
            saved locally on your device via{" "}
            <code className="px-1 rounded bg-white/5">localStorage</code>:
            <code className="px-1 ml-1 rounded bg-white/5">portfolio_items</code> (your items) and{" "}
            <code className="px-1 rounded bg-white/5">guest_mode</code> (flag).
            We never receive this data unless you sign in and merge.
          </p>
          <p>
            <span className="text-text font-medium">Account data:</span>{" "}
            one row in <code className="px-1 rounded bg-white/5">account_rows</code> with a JSONB{" "}
            <code className="px-1 rounded bg-white/5">rows</code> payload and timestamps.
            Access is protected by Supabase RLS: only{" "}
            <code className="px-1 rounded bg-white/5">auth.uid()</code> can read/write its row.
          </p>
          <p>
            <span className="text-text font-medium">Account profile:</span> email and optional username managed by Supabase Auth.
          </p>
        </div>
      </section>

      <section className="card p-5 mb-6">
        <h2 className="text-lg font-semibold">Pricing data</h2>
        <p className="mt-3 text-sm text-muted">
          Price displays are snapshots from Steam and Skinport and should be
          treated as estimates. They may lag, and are not financial advice.
        </p>
      </section>

      <section className="card p-5 mb-6">
        <h2 className="text-lg font-semibold">Cookies & storage</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>
            • Supabase Auth may set cookies/local storage to keep you signed in.
          </li>
          <li>
            • Guest mode uses <code className="px-1 rounded bg-white/5">localStorage</code> only
            (no network requests) until you sign in.
          </li>
          <li>
            • We use{" "}
            <Link
              href="https://vercel.com/analytics"
              className="underline hover:no-underline"
            >
              Vercel Analytics
            </Link>{" "}
            and{" "}
            <Link
              href="https://vercel.com/docs/speed-insights"
              className="underline hover:no-underline"
            >
              Speed Insights
            </Link>{" "}
            for aggregated performance metrics—no ad tracking.
          </li>
        </ul>
      </section>

      <section className="card p-5 mb-6">
        <h2 className="text-lg font-semibold">Your controls</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>
            • <span className="text-text">Clear local data:</span> open{" "}
            <span className="text-text">Settings → Clear data…</span> to remove
            guest items and the guest flag from this device.
          </li>
          <li>
            • <span className="text-text">Reset password:</span> open{" "}
            <span className="text-text">Settings → Send password reset</span>.
          </li>
          <li>
            • <span className="text-text">Cloud data deletion:</span> open a{" "}
            <Link
              href="https://github.com/realuwy/cs2-tracker/issues"
              className="underline hover:no-underline"
            >
              GitHub issue
            </Link>{" "}
            with your account email and request deletion (we’ll remove your{" "}
            <code className="px-1 rounded bg-white/5">account_rows</code> data).
          </li>
        </ul>
      </section>

      

      <p className="mt-8 text-xs text-muted">Updated: 20 Oct 2025</p>
    </main>
  );
}
