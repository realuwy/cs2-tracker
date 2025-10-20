"use client";

import { useEffect, useState } from "react";
import SettingsModal from "./SettingsModal";

export default function SettingsHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setOpen(true);
    window.addEventListener("settings:open", fn);
    return () => window.removeEventListener("settings:open", fn);
  }, []);

  return <SettingsModal open={open} onClose={() => setOpen(false)} />;
}
