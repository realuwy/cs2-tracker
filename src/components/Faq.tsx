// src/components/Faq.tsx
export default function Faq() {
  const faqs: { q: string; a: React.ReactNode }[] = [
    {
      q: "How do I import my Steam items?",
      a: (
        <>
          Go to <span className="font-medium">Dashboard → Import</span>. You can upload the JSON from
          the bookmarklet or paste raw Steam JSON (<code>assets/descriptions</code>) — both work.
          If Steam shows “Fetch failed: 400”, open your browser console, copy the JSON from the response,
          and paste it into the <span className="font-medium">Paste JSON</span> tab.
        </>
      ),
    },
    {
      q: "What prices do you use?",
      a: (
        <>
          We fetch Skinport prices (A$) and backfill Steam prices with sanity checks. Totals update automatically
          every ~15 minutes, or instantly when you hit the refresh button in the Stats card.
        </>
      ),
    },
    {
      q: "Can I edit quantities, wear, float, and pattern?",
      a: (
        <>
          Yep. Add items with a base name + wear (exterior). Float and pattern are optional display notes and
          don’t affect pricing. Edit or delete items anytime from the table or card list.
        </>
      ),
    },
    {
      q: "Does this change my Steam inventory?",
      a: (
        <>
          No. This is a viewer/tracker only. Nothing is listed, traded, or modified on your account.
        </>
      ),
    },
    {
      q: "Where is my data stored?",
      a: (
        <>
          Your rows are saved locally in your browser. If you’re signed in, they also sync to your account so you
          can use multiple devices. See our <a href="/privacy" className="underline">Privacy</a>.
        </>
      ),
    },
    {
      q: "Some items don’t show a price—why?",
      a: (
        <>
          Not all items have reliable market data. We hide outliers (e.g., Steam way outside Skinport range) and
          unpriced collectibles. You can still keep them for completeness.
        </>
      ),
    },
    {
      q: "Can I use this on mobile?",
      a: (
        <>
          Yes—everything is responsive. The table switches to compact cards on smaller screens.
        </>
      ),
    },
    {
      q: "How do I reset or remove my data?",
      a: (
        <>
          On the dashboard, delete rows from the table. To fully reset local data, clear your browser storage for
          this site. If you’re signed in, you can also clear your synced rows from the account menu.
        </>
      ),
    },
  ];

  return (
    <section id="faq" className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-border bg-surface/60 p-6 md:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-semibold">FAQ</h2>
          <a
            href="/dashboard"
            className="rounded-full border border-border bg-surface2 px-3 py-1.5 text-sm hover:bg-surface transition"
          >
            Go to dashboard
          </a>
        </div>

        <div className="space-y-2">
          {faqs.map(({ q, a }, i) => (
            <details
              key={i}
              className="group rounded-xl border border-border bg-surface2/60 p-4 open:bg-surface/70"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <span className="font-medium">{q}</span>
                <svg
                  className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div className="mt-3 text-sm text-muted leading-relaxed">{a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
