"use client";

import { useEffect, useState } from "react";
import AuthModal from "@/components/auth-modal"; // assumes your existing modal default-exports the UI

type Mode = "login" | "signup";

export default function AuthModalHost() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent)?.detail as { mode?: Mode } | undefined;
      if (detail?.mode === "signup") setMode("signup");
      else setMode("login");
      setOpen(true);
    };
    const onClose = () => setOpen(false);

    window.addEventListener("open-auth", onOpen as EventListener);
    window.addEventListener("close-auth", onClose as EventListener);
    return () => {
      window.removeEventListener("open-auth", onOpen as EventListener);
      window.removeEventListener("close-auth", onClose as EventListener);
    };
  }, []);

  return (
    <AuthModal
      open={open}
      mode={mode}
      onClose={() => setOpen(false)}
    />
  );
}
