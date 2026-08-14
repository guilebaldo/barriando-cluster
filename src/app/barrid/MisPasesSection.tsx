"use client";

import Link from "next/link";
import { ChevronRight, Ticket } from "lucide-react";

export default function MisPasesSection({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/pases/mios"
      className={`mt-5 flex w-full items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15 active:scale-[0.99] ${
        compact ? "px-4 py-3.5" : "px-4 py-3"
      }`}
    >
      <span className="inline-flex items-center gap-2.5 min-w-0">
        <Ticket className={compact ? "w-5 h-5 shrink-0" : "w-4 h-4 shrink-0"} />
        <span className="min-w-0">
          <span
            className={`block font-bold uppercase tracking-wider ${
              compact ? "text-sm" : "text-xs"
            }`}
          >
            Mis pases
          </span>
          <span className={`block text-slate-300 font-light ${compact ? "text-xs mt-0.5" : "text-[11px] mt-0.5"}`}>
            Boletos y QR de entrada
          </span>
        </span>
      </span>
      <ChevronRight className={compact ? "w-5 h-5 shrink-0 opacity-80" : "w-4 h-4 shrink-0 opacity-80"} />
    </Link>
  );
}
