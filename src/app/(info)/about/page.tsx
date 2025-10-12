export const metadata = {
  title: "About · CS2 Tracker",
  description: "What this project is and how it works.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">About</h1>
      <div className="prose prose-invert prose-zinc">
        <p>
          CS2 Tracker helps you inventory items and see rough market values. It’s focused on a fast,
          minimal UI and local-first behavior.
        </p>
        <h3>How pricing works</h3>
        <ul>
          <li>Prices are fetched from public endpoints (Skinport/Steam) and cached.</li>
          <li>
            We use <em>Item + Wear</em> to match prices. Float/Pattern are notes for display.
          </li>
          <li>Totals are computed client-side; they are estimates, not financial advice.</li>
        </ul>
        <h3>Local-first</h3>
        <p>
          Your rows are stored in your browser’s <code>localStorage</code> so they persist without an
          account. Clear your browser data to reset.
        </p>
        <h3>Open-source</h3>
        <p>
          Repo: <a className="underline" href="https://github.com/realuwy/cs2-tracker">realuwy/cs2-tracker</a>.
          Issues and PRs are welcome.
        </p>
      </div>
    </div>
  );
}
