import Link from "next/link";

export const metadata = {
  title: "FAQ · CS2 Tracker",
  description: "Common questions about accounts, guest mode, pricing data, and Steam inventory.",
};

export default function FaqPage() {
  const faqs = [
    {
      q: "Do I need an account?",
      a: "No. You can use guest mode (local-only). If you sign up later, your local items merge into your account automatically.",
    },
    {
      q: "How does guest → account merge work?",
      a: "On successful sign in/up, local items are upserted to your account. We avoid duplicates using item identity (e.g., name + wear).",
    },
    {
      q: "Where do prices come from?",
      a: "Snapshot prices from Steam and Skinport. They can lag behind live markets; treat as estimates.",
    },
    {
      q: "Why can’t I load my Steam inventory?",
      a: "Ensure the inventory is Public and the SteamID64 is correct. Steam sometimes returns 400 'null' or 403 during rate limits—try again shortly.",
    },
    {
      q: "Can I sign in with username?",
      a: "Yes, sign in with either email or username.",
    },
    {
      q: "What data do you store?",
      a: "Signed-in users: rows in Supabase under your user. Guests: localStorage only. See Privacy for details.",
    },
    {
      q: "Will I lose data if I sign out?",
      a: "No. Account data stays in your account. Guest data remains in your browser.",
    },
    {
      q: "Which items are supported?",
      a: "CS2 skins and common items. Some niche items may not parse yet.",
    },
    {
      q: "How do I report a bug or request a feature?",
      a: "Open a GitHub issue or contact us via the link in the footer.",
    },
  ];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          ← Home
        </Link>
        <Link
          href="/privacy"
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-black hover:bg-amber-500"
        >
          Privacy →
        </Link>
      </div>

      <h1 className="mb-4 text-2xl font-semibold text-white">FAQ</h1>
      <p className="mb-8 text-zinc-400">
        Quick answers about guest mode, accounts, pricing data, and inventory sync.
      </p>

      <div className="space-y-6">
        {faqs.map(({ q, a }) => (
          <div key={q} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-base font-semibold text-white">{q}</h2>
            <p className="mt-2 text-sm text-zinc-400">{a}</p>
          </div>
        ))}
      </div>

      {/* Optional: link back to dashboard */}
      <div className="mt-10">
        <Link
          href="/dashboard"
          className="rounded-xl bg-lime-400 px-4 py-2 font-semibold text-black hover:bg-lime-300"
        >
          Go to Dashboard
        </Link>
      </div>

      {/* Basic FAQ schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(({ q, a }) => ({
              "@type": "Question",
              "name": q,
              "acceptedAnswer": { "@type": "Answer", "text": a },
            })),
          }),
        }}
      />
    </main>
  );
}
