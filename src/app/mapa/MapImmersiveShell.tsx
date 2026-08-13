"use client";

import { useImmersiveScrollLock } from "@/app/components/useImmersiveScrollLock";

/**
 * Mismo contrato que Ajustes: flujo de documento (no fixed viewport),
 * alto 100dvh + padding del hub vía CSS app-mobile-shell.
 */
export default function MapImmersiveShell({ children }: { children: React.ReactNode }) {
  useImmersiveScrollLock();

  return (
    <div className="map-immersive-shell relative z-0 flex flex-col h-[100dvh] max-h-[100dvh] bg-white text-slate-900 font-sans antialiased overflow-hidden overscroll-none lg:h-screen lg:max-h-screen">
      {children}
    </div>
  );
}
