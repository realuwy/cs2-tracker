import Link from "next/link";
import ImportBar from "@/components/import-bar";
import DemoNotice from "@/components/demo-notice";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold">Track your CS2 inventory pricing</h1>
        <p className="text-neutral-300">
          Import your public Steam inventory, add storage items manually, and see up-to-date prices (Skinport-first).
        </p>
      </section>
      <div className="max-w-3xl mx-auto">
        <ImportBar />
        <DemoNotice className="mt-4" />
      </div>
      <section className="grid md:grid-cols-3 gap-4">
        <FeatureCard title="No Steam login" desc="Paste a public profile URL or SteamID64. We only fetch public data." />
        <FeatureCard title="Manual storage items" desc="Add items not visible in your inventory (storage unit contents)." />
        <FeatureCard title="Fast & modern" desc="Virtualized table, cached prices, smooth UI." />
      </section>
      <div className="text-center">
        <Link href="/app/market" className="inline-flex items-center rounded-md bg-white/10 hover:bg-white/15 px-4 py-2 text-sm">
          Go to Market
        </Link>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 p-4 bg-neutral-900/40">
      <div className="font-medium">{title}</div>
      <div className="text-sm text-neutral-400">{desc}</div>
    </div>
  )
}
