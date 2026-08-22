"use client";

import Link from "next/link";
import { List, CalendarDays, Ticket } from "lucide-react";

export type PasesNavView = "lista" | "calendario" | "mios";

function tabClasses(active: boolean) {
  return `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
    active ? "bg-[#27366D] text-white" : "text-slate-500 hover:text-[#27366D]"
  }`;
}

export default function PasesViewNav({
  active,
  onViewChange,
  showMisPases = false,
}: {
  active: PasesNavView;
  /** En /pases: cambia lista/calendario sin navegar */
  onViewChange?: (view: "lista" | "calendario") => void;
  showMisPases?: boolean;
}) {
  return (
    <div className="flex justify-center shrink-0">
      <div
        className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm"
        role="tablist"
        aria-label="Vista de pases"
      >
        {onViewChange ? (
          <>
            <button
              type="button"
              role="tab"
              aria-selected={active === "lista"}
              onClick={() => onViewChange("lista")}
              className={tabClasses(active === "lista")}
            >
              <List className="w-3.5 h-3.5" />
              Lista
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={active === "calendario"}
              onClick={() => onViewChange("calendario")}
              className={tabClasses(active === "calendario")}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Calendario
            </button>
          </>
        ) : (
          <>
            <Link href="/pases" role="tab" className={tabClasses(false)}>
              <List className="w-3.5 h-3.5" />
              Lista
            </Link>
            <Link href="/pases?view=calendario" role="tab" className={tabClasses(false)}>
              <CalendarDays className="w-3.5 h-3.5" />
              Calendario
            </Link>
          </>
        )}

        {showMisPases ? (
          active === "mios" ? (
            <span role="tab" aria-selected className={tabClasses(true)}>
              <Ticket className="w-3.5 h-3.5" />
              Mis pases
            </span>
          ) : (
            <Link href="/pases/mios" role="tab" className={tabClasses(false)}>
              <Ticket className="w-3.5 h-3.5" />
              Mis pases
            </Link>
          )
        ) : null}
      </div>
    </div>
  );
}
