export const metadata = {
  title: "About · CS2 Tracker",
  description: "What CS2 Tracker is, how it works, and what’s coming next.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 text-text">
      <h1 className="mb-3 text-3xl font-semibold">About CS2 Tracker</h1>
      <p className="mb-6 text-muted">
        CS2 Tracker helps you view, value, and manage your Counter-Strike 2
        inventory with a clean, fast UI. The interface uses carbon surfaces and
        a neon-lime accent for clarity in dark mode.
      </p>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-2 text-xl font-semibold">What’s inside</h2>
        <ul className="list-inside list-disc space-y-1 text-muted">
          <li>Inventory table with wear/float/quantity rolled into concise cells</li>
          <li>Neon-lime highlights for actions and important states</li>
          <li>Keyboard-friendly focus rings and accessible contrast</li>
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-2 text-xl font-semibold">Roadmap</h2>
        <ul className="list-inside list-disc space-y-1 text-muted">
          <li>Micro-glow hovers on interactive components</li>
          <li>Optional theme toggle (neon ↔︎ neutral)</li>
          <li>More price sources and filters</li>
        </ul>
      </section>

      <p className="mt-6 text-sm text-muted">
        CS2 Tracker is under active development. Thanks for using it!
      </p>
    </div>
  );
}
