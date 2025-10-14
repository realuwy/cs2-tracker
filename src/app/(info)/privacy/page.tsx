import Link from "next/link";

export const metadata = {
  title: "Privacy · CS2 Tracker",
  description: "How we handle data for CS2 Tracker.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 text-text">
      {/* Top nav */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface2 hover:ring-1 hover:ring-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          ← Home
        </Link>
        <Link
          href="/dashboard"
          className="btn-accent px-3 py-1.5 text-sm"
        >
          Go to Dashboard →
        </Link>
      </div>

      <h1 className="mb-3 text-3xl font-semibold">Privacy Policy</h1>
      <p className="mb-4 text-muted">
        We minimize data collection. Inventory data is fetched only to render your view and
        improve features. We don’t sell your data.
      </p>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-2 text-xl font-semibold">Data we handle</h2>
        <ul className="list-inside list-disc space-y-1 text-muted">
          <li>Public Steam inventory metadata required to display items</li>
          <li>Anonymous diagnostics needed to keep the app fast and stable</li>
          <li>Account info you explicitly provide for sign-in</li>
        </ul>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-2 text-xl font-semibold">Your choices</h2>
        <ul className="list-inside list-disc space-y-1 text-muted">
          <li>Use as a guest with limited features</li>
          <li>Delete local data via the account menu</li>
          <li>Contact us to remove server-side data where applicable</li>
        </ul>
      </div>

      <p className="mt-6 text-sm text-muted">
        Questions?{" "}
        <a
          href="mailto:support@example.com"
          className="underline decoration-accent/30 underline-offset-4 hover:decoration-accent text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded"
        >
          Email support
        </a>
        .
      </p>
    </div>
  );
}
