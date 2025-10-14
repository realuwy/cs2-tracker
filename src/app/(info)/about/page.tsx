import Link from "next/link";

export const metadata = {
  title: "About · CS2 Tracker",
  description: "What CS2 Tracker is, how it works, and what’s coming next.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 text-text">
      {/* Top nav */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface2 hover:ring-1 hover:ring-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          ← Back to Dashboard
        </Link>
        <Link
          href="/privacy"
          className="btn-accent px-3 py-1.5 text-sm"
        >
          Privacy →
        </Link>
      </div>

      <h1 className="mb-3 text-3xl font-semibold">About CS2 Tracker</h1>
      <p className="mb-6 text-muted">
        CS2 Tracker helps you view, value, and manage your Counter-Strike 2 inventory with a clean, fast UI.
        We use <span className="text-accent">accent</span> tokens and carbon surfaces for readability in dark mode.
      </p>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-2 text-xl font-semibold">What’s inside</h2>
        <ul className="list-inside list-disc space-y-1 text-muted">
          <li>Inventory table with wear/float/quantity rolled into concise cells</li>
          <li>Neon-lime highlights for actions and important states</li>
          <li>Keyboard-friendly focus rings and accessible contrast</li>
        </ul>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-2 text-xl font-semibold">Roadmap</h2>
        <ul className="list-inside list-disc space-y-1 text-muted">
          <li>Micro-glow hovers on interactive components</li>
          <li>Theme toggle (neon ↔︎ neutral)</li>
          <li>More price sources and filters</li>
        </ul>
      </div>

      <p className="mt-6 text-sm text-muted">
        Found a bug or have an idea?{" "}
        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-accent/30 underline-offset-4 hover:decoration-accent text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded"
        >
          Open an issue
        </a>
        .
      </p>
    </div>
  );
}
