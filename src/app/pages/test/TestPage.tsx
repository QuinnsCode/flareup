// src/app/pages/test/TestPage.tsx
"use client";
import { Suspense, use } from "react";
import { ThisIsFine } from "@/app/components/thisIsFine/ThisIsFine";

const slowPromise = new Promise(r => setTimeout(r, 10_000)); // 10s is plenty

function SlowThing() {
  use(slowPromise);
  return <p style={{ color: "#22c55e", fontFamily: "monospace" }}>// loaded ✓</p>;
}

export default function TestPage() {
  return (
    <Suspense fallback={<ThisIsFine />}>
      <SlowThing />
    </Suspense>
  );
}