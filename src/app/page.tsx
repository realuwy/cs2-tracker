 // src/app/page.tsx
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-transparent to-black/10">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] tracking-wide text-accent">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                CS2 inventory, simplified
              </div>

              <h1 className="mt-4 text-3xl font-extrabold leading-tight text-text md:text-5xl">
                Track, value, and manage your{" "}
                <span className="text-accent drop-shadow-[0_0_10px_var(--tw-shadow-color)] [--tw-shadow-color:theme(colors.accent.glow)]">
                  CS2 items
                </span>{" "}
                in one place
              </h1>

              <p className="mt-4 max-w-prose text-muted md:text-lg">
                Import from Steam, add items manually, and see live price
                snapshots from Skinport &amp; Steam. Works with an account or as
                a guest—your data stays with you.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {/* Open the auth chooser (signin / signup / guest) */}
         <Link
  href="/?auth=signup"
  className="rounded-xl bg-lime-400 px-5 py-3 font-semibold text-black transition hover:bg-lime-300"
>
  Get Started
</Link>


              </div>

              <p className="mt-3 text-xs text-muted">
                No email verification required. You can{" "}
                <span className="text-text">continue as guest</span> and upgrade
                later—your items will sync to your new account.
              </p>
            </div>

            {/* Hero preview (mobile + desktop) */}
            <div className="relative">
              <div className="pointer-events-none absolute -inset-8 -z-10 hidden rounded-[28px] blur-2xl md:block [background:radial-gradient(600px_200px_at_60%_50%,theme(colors.accent.DEFAULT)/15%,transparent)]" />
              <div className="rounded-2xl border border-border bg-surface/60 p-4 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)]">
                <Image
                  src="/hero-dashboard.png"
                  alt="CS2 Tracker dashboard preview"
                  width={970}
                  height={640}
                  priority
                  sizes="(min-width: 768px) 600px, 100vw"
                  className="w-full rounded-xl border border-border shadow-[0_0_30px_-10px_var(--tw-shadow-color)] [--tw-shadow-color:theme(colors.accent.glow)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-semibold">Why CS2 Tracker?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            title="Guest or Account"
            body="Start as a guest with local-only storage. Create an account anytime—your existing dashboard is synced to the cloud automatically."
          />
          <Feature
            title="Smart pricing"
            body="Skinport and Steam prices with sanity checks. Totals update automatically with quantity and live refresh."
          />
          <Feature
            title="Manual + Import"
            body="Paste Steam JSON or use the import wizard. Add items manually with wear, float, and pattern notes."
          />
          <Feature
            title="Fast search"
            body="Autocomplete shows base item names only (no wear spam). Pick a wear separately for clean entries."
          />
          <Feature
            title="Every device"
            body="With an account, your dashboard follows you to any device. As a guest, your data is saved locally."
          />
          <Feature
            title="Privacy-first"
            body="No email verification required to start. Password resets by email only when you need them."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
        {/* tiny bolt icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M13 2L3 14h7l-1 8 11-14h-7l0-6z" />
        </svg>
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}

