// src/components/Footer.tsx
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const OnboardingModalHost = dynamic(() => import("@/components/OnboardingModalHost"), { ssr: false });

export default function SiteFooter() {
  const openContact = () => window.dispatchEvent(new CustomEvent("contact:open"));

  return (
    <footer
      role="contentinfo"
      className="flex-shrink-0 border-t border-border bg-surface/60"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted md:flex-row">
        {/* Left: brand + alpha */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-text">CS2 Tracker</span>
          </span>
          <span className="badge badge-accent">alpha</span>
        </div>

        {/* Center: links */}
        <nav className="flex items-center gap-6">
          <Link href="/about" className="link-muted">About</Link>
          <Link href="/privacy" className="link-muted">Privacy</Link>
          <button
            type="button"
            onClick={openContact}
            className="link-muted bg-transparent p-0"
          >
            Contact
          </button>
        </nav>

        {/* Right: credit */}
        <div className="whitespace-nowrap">
          © {new Date().getFullYear()} CS2 Tracker
        </div>
      </div>
    </footer>
    <Suspense fallback={null}><OnboardingModalHost /></Suspense>
  );
}

