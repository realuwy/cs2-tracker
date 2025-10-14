export const metadata = {
  title: "Privacy · CS2 Tracker",
  description: "How we handle data for CS2 Tracker.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 text-text">
      <h1 className="mb-3 text-3xl font-semibold">Privacy Policy</h1>
      <p className="mb-4 text-muted">
        We minimize data collection. Inventory data is fetched only to render
        your view and improve features. We don’t sell your data.
      </p>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-2 text-xl font-semibold">Data we handle</h2>
        <ul className="list-inside list-disc space-y-1 text-muted">
          <li>Public Steam inventory metadata required to display items</li>
          <li>Anonymous diagnostics used to keep the app fast and stable</li>
          <li>Account info you explicitly provide for sign-in (if you create one)</li>
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-2 text-xl font-semibold">Your choices</h2>
        <ul className="list-inside list-disc space-y-1 text-muted">
          <li>Use as a guest with limited features</li>
          <li>Clear local data via the account menu</li>
          <li>Request deletion of server-side data where applicable</li>
        </ul>
      </section>

      <p className="mt-6 text-sm text-muted">
        This page describes current practices and may be updated as features evolve.
      </p>
    </div>
  );
}
