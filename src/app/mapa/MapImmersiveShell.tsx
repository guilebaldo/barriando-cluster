"use client";

import { useImmersiveScrollLock } from "@/app/components/useImmersiveScrollLock";

/**
 * Mismo contrato que Ajustes: flujo de documento (no fixed viewport),
 * alto 100svh + padding del hub vía CSS app-mobile-shell.
 */
export default function MapImmersiveShell({ children }: { children: React.ReactNode }) {
  useImmersiveScrollLock();

  return (
    <div className="map-immersive-shell relative z-0 flex flex-col h-[100svh] max-h-[100svh] bg-white text-slate-900 font-sans antialiased overflow-hidden overscroll-none">
      {children}
    </div>
  );
}
