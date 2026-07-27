"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useAppMobileShell } from "@/app/components/AppBottomNav";

/** Cierra MAPA / Cuponera / Pasaporte y vuelve al QR de BarrID (solo móvil app shell). */
export default function CloseToBarrId() {
  const pathname = usePathname();
  const enabled = useAppMobileShell();
  const onBarrId = pathname === "/barrid" || pathname.startsWith("/barrid/");
  if (!enabled || onBarrId) return null;

  return (
    <Link
      href="/barrid"
      className="md:hidden fixed top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-[75] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-[#27366D]/90 text-white shadow-lg backdrop-blur-sm hover:bg-[#1e2b58] transition"
      aria-label="Cerrar y volver a BarrID"
      title="Volver a BarrID"
    >
      <X className="w-5 h-5" />
    </Link>
  );
}
