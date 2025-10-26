// src/components/auth-modal.tsx
"use client";

import React from "react";

// 👇 add this props type
type AuthModalProps = {
  onClose?: () => void;
};

// 👇 make sure your default export accepts the prop
export default function AuthModal({ onClose }: AuthModalProps) {
  // ...existing code...

  // wherever you close the modal, ALSO call onClose?.()
  // examples (adapt these to your code):

  // close button handler:
  // const close = () => { setOpen(false); onClose?.(); };

  // after successful action:
  // setOpen(false);
  // onClose?.();

  return (
    // ...existing JSX...
  );
}
