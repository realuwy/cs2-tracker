"use client";

import { useEffect, useState } from "react";
import AuthModal from "@/components/auth-modal";

type Mode = "login" | "signup" | "reset";

const OPEN = "cs2:open-auth";
const CLOSE = "cs2:close-auth";

export default function AuthModalHost() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");

  useEffect(() => {
    const onOpen = (e: Event) => {
      // only open if we got a proper detail payload
      const detail = (e as CustomEvent)?.detail as { mode?: Mode } | undefined;
      if (!detail) return;
      setMode(detail.mode ?? "login");
      setOpen(true);
    };
    const onClose = () => setOpen(false);

    window.addEventListener(OPEN, onOpen as EventListener);
    window.addEventListener(CLOSE, onClose as EventListener);
    return () => {
      window.removeEventListener(OPEN, onOpen as EventListener);
      window.removeEventListener(CLOSE, onClose as EventListener);
    };
  }, []);

  if (!open) return null;
  return <AuthModal initialMode={mode} onClose={() => setOpen(false)} />;
}
