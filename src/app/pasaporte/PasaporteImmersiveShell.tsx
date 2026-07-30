"use client";

import { useImmersiveScrollLock } from "@/app/components/useImmersiveScrollLock";

/** Flujo de documento como Ajustes; padding del hub vía CSS app-mobile-shell. */
export default function PasaporteImmersiveShell({ children }: { children: React.ReactNode }) {
  useImmersiveScrollLock();

  return (
    <div className="map-immersive-shell relative z-0 flex flex-col h-[100svh] max-h-[100svh] bg-[#faf6ef] text-slate-900 font-sans antialiased overflow-hidden overscroll-none">
      {children}
    </div>
  );
}
