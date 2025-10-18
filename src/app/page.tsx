// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "CS2 Tracker · Track, value & manage your CS2 items",
  description:
    "Import from Steam or add items manually. Works with an account or as a guest—your data stays with you.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-zinc-200">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-16 md:pt-20">
        <div className="flex flex-col-reverse items-center gap-10 md:flex-row md:items-start">
          {/* Left: copy + CTA */}
          <div className="w-full md:w-1/2">
            {/* Badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1 text-sm text-lime-300">
              <span className="inline-block h-2 w-2 rounded-full bg-lime-300" />
              CS2 inventory, simplified
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Track, value, and
              <br />
              manage your <span className="text-lime-300">CS2</span>
              <br />
              <span className="text-lime-300">items</span> in one place
            </h1>

            {/* Subcopy */}
            <p className="mt-4 max-w-xl text-zinc-400">
              Import from Steam, add items manually, and see live price snapshots
              from Skinport & Steam. Works with an account or as a guest—your data
              stays with you.
            </p>

            {/* CTA */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-xl bg-lime-400 px-5 py-3 font-semibold text-black transition hover:bg-lime-300"
              >
                Get Started
              </Link>
            </div>

            {/* Tiny reassurance */}
            <p className="mt-3 text-sm text-zinc-500">
              No email verification required. You can continue as guest and
              upgrade later—your items will sync to your new account.
            </p>
          </div>

          {/* Right: preview image (visible on mobile too) */}
          <div className="w-full md:w-1/2">
            <div className="relative mx-auto w-full max-w-[720px] overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl">
              <Image
                src="/hero-dashboard.png" // update if your path differs
                alt="CS2 Tracker dashboard preview"
                width={1440}
                height={900}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="block h-auto w-full"
              />
              {/* optional subtle glow */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-lime-300/10" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer spacer -> your global footer component handles the rest */}
      <div className="h-16" />
    </main>
  );
}
