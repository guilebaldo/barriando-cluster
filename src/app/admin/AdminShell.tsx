"use client";

import type { ReactNode } from "react";
import { useImmersiveScrollLock } from "@/app/components/useImmersiveScrollLock";

/**
 * Admin en móvil con hub: viewport fijo + scroll interno.
 * Evita el rubber-band del documento que hace “flotar” el hub al hacer scroll.
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  useImmersiveScrollLock({ mobileOnly: true });

  return (
    <div className="admin-mobile-shell relative z-0 flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden overscroll-none md:h-auto md:max-h-none md:overflow-visible md:overscroll-auto">
      {children}
    </div>
  );
}
