"use client";

export default function BackToTopButton({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={onClick}
      className={[
        "fixed bottom-6 right-6 z-50 rounded-full bg-surface/90 shadow-lg shadow-black/40",
        "backdrop-blur px-4 h-12 inline-flex items-center gap-2 text-text",
        "border border-border hover:bg-surface2 transition-all duration-200",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none",
      ].join(" ")}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="-mt-[1px]">
        <path
          d="M6 14l6-6 6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-sm">Top</span>
    </button>
  );
}
