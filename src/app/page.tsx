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
                Add items manually and see live price snapshots from Skinport &amp; Steam.
                Works with an account or as a guest—your data stays with you.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {/* Open auth modal in "chooser" (Sign in / Sign up / Guest) */}
               <Link href="/?onboard=1" className="btn-accent">Get Started</Link>

              </div>

              <p className="mt-3 text-xs text-muted">
                No email verification required. You can{" "}
                <span className="text-text">continue as guest</span> and upgrade
                later—your items will sync to your new account.
              </p>
            </div>

            {/* Hero preview – visible on mobile too */}
            <div className="relative">
              <div className="pointer-events-none absolute -inset-8 -z-10 hidden rounded-[28px] blur-2xl md:block [background:radial-gradient(600px_200px_at_60%_50%,theme(colors.accent.DEFAULT)/15%,transparent)]" />
              <div className="card p-4">
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
      title="Guest-first & offline"
      body="Start instantly with local-only storage. No account needed. When you create an account later, your existing items merge and sync to the cloud."
    />
    <Feature
      title="Manual add, smart parse"
      body={`Type “AK-47 | Redline (FT) x2 #123” — we detect wear, quantity, and keep your pattern/float notes.`}
    />
    <Feature
      title="Base-name autocomplete"
      body="Search shows base item names only (no wear spam). Pick a wear separately for clean, consistent entries."
    />
    <Feature
      title="Snapshot pricing"
      body="Steam & Skinport snapshot totals with sanity checks. Treat as estimates; refresh when you need a new snapshot."
    />
    <Feature
      title="Works everywhere"
      body="Responsive neon UI that feels great on mobile and desktop. Signed-in dashboards follow you; guest data stays on this device."
    />
    <Feature
      title="Your data, your controls"
      body="Settings lets you clear local data on this device and send a password-reset email. No ads, no trackers."
    />
  </div>
</section>

    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-4">
      <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M13 2L3 14h7l-1 8 11-14h-7l0-6z" />
        </svg>
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
