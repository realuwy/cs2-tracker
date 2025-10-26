"use client";
import { useEffect, useState } from "react";

type Props = {
  /** If provided, bypass internal scroll logic and just show/hide via prop */
  visible?: boolean;
  /** Optional custom click handler (default: smooth scroll to top) */
  onClick?: () => void;
};

export default function BackToTopButton({ visible, onClick }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible !== undefined) return; // controlled by prop
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [visible]);

  const isVisible = visible ?? show;
  if (!isVisible) return null;

  const handleClick = () => {
    if (onClick) return onClick();
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  };

  return (
    <button
      aria-label="Back to top"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-40 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-medium text-accent backdrop-blur hover:bg-accent/15"
    >
      ↑ Top
    </button>
  );
}
