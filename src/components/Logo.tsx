"use client";

import Link from "next/link";

export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="text-accent drop-shadow-[0_0_10px_var(--tw-shadow-color)] [--tw-shadow-color:theme(colors.accent.glow)]"
    >
      {/* bent arrow rising to the right */}
      <polyline
        points="4,16 11,16 16,7"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon points="16,4 22,4 22,10" fill="currentColor" />
    </svg>
  );
}

export default function Logo({
  withText = true,
  to = "/",
  markSize = 22,
  showAlpha = true,
}: {
  withText?: boolean;
  to?: string;
  markSize?: number;
  showAlpha?: boolean;
}) {
  return (
    <Link
      href={to}
      className="group inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      aria-label="CS2 Tracker home"
    >
      <BrandMark size={markSize} />
      {withText && (
        <span className="inline-flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-text">CS2 Tracker</span>
          {showAlpha && (
            <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              alpha
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
