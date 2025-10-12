import Link from "next/link";

export const metadata = {
  title: "Privacy · CS2 Tracker",
  description: "How CS2 Tracker handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Top link (only to About) */}
      <div className="mb-6 flex items-center justify-start">
        <Link
          href="/about"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          ← About
        </Link>
      </div>

      <h1 className="mb-3 text-2xl font-semibold">Privacy</h1>
      <p className="mb-6 text-zinc-400">
        CS2 Tracker is designed to be local-first. Most data stays in your browser.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="mb-2 text-xl font-medium">What we store</h2>
          <ul className="list-inside list-disc text-zinc-300">
            <li>Your rows (items you add/import) are saved in <code>localStorage</code> under <code>cs2:dashboard:rows</code>.</li>
            <li>Transient price/image data from third parties may be cached by your browser for performance.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-medium">What we don’t store</h2>
          <ul className="list-inside list-disc text-zinc-300">
            <li>No account data, passwords, or personal info.</li>
            <li>No server-side copies of your local rows.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-medium">Third-party services</h2>
          <p className="text-zinc-300">
            Prices and images may come from services like Skinport and Steam. When you view that data,
            their terms and privacy policies apply.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-medium">Your controls</h2>
          <ul className="list-inside list-disc text-zinc-300">
            <li>Clear your browser data to remove all locally stored rows.</li>
            <li>You can re-import items at any time.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-medium">Contact</h2>
          <p className="text-zinc-300">
            Questions? Open an issue on{" "}
            <a
              href="https://github.com/realuwy/cs2-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline"
            >
              GitHub
            </a>.
          </p>
        </section>
      </div>

      {/* Bottom link (only to About) */}
      <div className="mt-10 flex items-center justify-start">
        <Link
          href="/about"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          ← About
        </Link>
      </div>
    </div>
  );
}
