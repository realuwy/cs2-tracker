import Link from "next/link";

export const metadata = {
  title: "Privacy · CS2 Tracker",
  description: "Local-first by default. What data we keep and what we don’t.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Top nav */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/about"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          ← About
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-black hover:bg-amber-500"
        >
          Dashboard →
        </Link>
      </div>

      <h1 className="mb-3 text-2xl font-semibold">Privacy</h1>
      <p className="mb-8 text-zinc-400">
        CS2 Tracker is designed to be <span className="font-medium">local-first</span>. Most data
        stays in your browser.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="mb-2 text-xl font-medium">What we store</h2>
          <ul className="list-inside list-disc text-zinc-300">
            <li>
              <span className="font-medium">Your rows</span> (items you add/import) are saved in{" "}
              <code className="rounded bg-zinc-900 px-1">localStorage</code> under{" "}
              <code className="rounded bg-zinc-900 px-1">cs2:dashboard:rows</code>.
            </li>
            <li>
              Transient pricing and image data from third parties may be cached in the browser for
              performance.
            </li>
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
            Prices and images may come from services like Skinport and Steam. When you view that
            data, their terms and privacy policies apply.
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
            <a className="underline" href="https://github.com/realuwy/cs2-tracker" target="_blank">
              GitHub
            </a>.
          </p>
        </section>
      </div>

      {/* Bottom nav */}
      <div className="mt-10 flex items-center justify-between">
        <Link
          href="/about"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          ← About
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-black hover:bg-amber-500"
        >
          Dashboard →
        </Link>
      </div>
    </div>
  );
}
