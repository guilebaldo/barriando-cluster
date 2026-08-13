"use client";

import { useImmersiveScrollLock } from "@/app/components/useImmersiveScrollLock";

/**
 * Móvil/tablet: viewport 100dvh (ficha inferior).
 * Escritorio (lg+): página con scroll y footer, como BarrID.
 */
export default function MapImmersiveShell({ children }: { children: React.ReactNode }) {
  useImmersiveScrollLock({ maxWidthPx: 1023 });

  return (
    <div className="map-immersive-shell relative z-0 flex flex-col h-[100dvh] max-h-[100dvh] bg-white text-slate-900 font-sans antialiased overflow-hidden overscroll-none lg:h-auto lg:max-h-none lg:min-h-screen lg:overflow-visible lg:overscroll-auto lg:bg-slate-50">
      {children}
    </div>
  );
}
