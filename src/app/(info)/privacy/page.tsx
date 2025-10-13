import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10 text-slate-200">
      {/* Top nav back */}
      <div className="mb-6">
        <Link
          href="/about"
          className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-900/60"
        >
          ← About
        </Link>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
      <p className="mt-3 text-slate-400">
        CS2 Tracker is designed to be local-first. Your data stays with you unless you
        explicitly sign in to sync it to your account.
      </p>

      <div className="mt-8 space-y-8">
        {/* What we store */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold">What we store</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
            <li>
              <span className="font-medium">Guest mode:</span> your rows are saved in{" "}
              <code className="rounded bg-slate-800/80 px-1.5 py-0.5">localStorage</code> under{" "}
              <code className="rounded bg-slate-800/80 px-1.5 py-0.5">cs2:dashboard:rows</code>.
            </li>
            <li>
              <span className="font-medium">Signed-in mode:</span> your rows are synced to your
              account so they’re available across devices. Only your account can access them.
            </li>
            <li>
              Transient price / image data from third-party services may be cached by your
              browser for performance.
            </li>
          </ul>
        </section>

        {/* What we don't store */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold">What we don’t store</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
            <li>No advertising profiles.</li>
            <li>No sale of personal data.</li>
            <li>No server-side copy of guest rows.</li>
          </ul>
        </section>

        {/* Third-party services */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold">Third-party services</h2>
          <p className="mt-3 text-slate-300">
            Prices and images may come from services like Skinport and Steam. When you view that
            data, their terms and privacy policies apply.
          </p>
        </section>

        {/* Your controls */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-semibold">Your controls</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
            <li>
              <span className="font-medium">Clear browser storage</span> to remove locally
              stored guest rows.
            </li>
            <li>
              <span className="font-medium">Sign in</span> to save rows to your account so they
              persist across devices.
            </li>
            <li>You can re-import items at any time.</li>
          </ul>
        </section>

         {/* CTA row */}
        <div className="flex items-center justify-end">
          <Link
            href="/about"
            className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            About
          </Link>
        </div>
      </div>
    </main>
  );
}
