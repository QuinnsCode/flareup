// src/app/pages/LandingPageClient/LandingPageClient.tsx
"use client";

import { useState } from "react";
import { SignupModal } from "@/app/components/SignupModal/SignupModal";

export function ModalTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SignupModal open={open} onClose={() => setOpen(false)} />
      <button
        className="path-cta coming"
        onClick={() => setOpen(true)}
      >
        Coming soon — get notified →
      </button>
    </>
  );
}