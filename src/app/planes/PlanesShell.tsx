"use client";

import type { ReactNode } from "react";
import { useImmersiveScrollLock } from "@/app/components/useImmersiveScrollLock";

/**
 * Móvil: mismo contrato que BarrID/Ajustes (flujo de documento + 100dvh).
 * Evita fixed inset-0, que desacomoda el hub en standalone / Safari.
 * Escritorio: layout normal con scroll y footer.
 */
export default function PlanesShell({ children }: { children: ReactNode }) {
  useImmersiveScrollLock({ mobileOnly: true });

  return (
    <div className="planes-mobile-shell relative z-0 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none bg-slate-50 text-slate-900 font-sans antialiased md:h-auto md:max-h-none md:min-h-screen md:overflow-visible md:overscroll-auto">
      {children}
    </div>
  );
}
