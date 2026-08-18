"use client";

import { useImmersiveScrollLock } from "@/app/components/useImmersiveScrollLock";

/**
 * Móvil: viewport a 100dvh en flujo de documento (como Ajustes), no fixed inset.
 * Franja navy superior: en standalone el hub oculta la Navbar y el notch
 * quedaba encima del listado.
 * Escritorio: layout normal con scroll y footer.
 */
export default function BarrIdShell({ children }: { children: React.ReactNode }) {
  useImmersiveScrollLock({ mobileOnly: true });

  return (
    <div className="barrid-shell relative z-0 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none bg-slate-50 text-slate-900 font-sans antialiased md:h-auto md:max-h-none md:min-h-screen md:overflow-visible md:overscroll-auto">
      <div
        className="shrink-0 bg-[#27366D] md:hidden"
        style={{ height: "env(safe-area-inset-top, 0px)" }}
        aria-hidden
      />
      {children}
    </div>
  );
}
