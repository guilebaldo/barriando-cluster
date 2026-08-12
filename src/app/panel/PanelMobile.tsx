"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  ArrowLeft,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useImmersiveScrollLock } from "@/app/components/useImmersiveScrollLock";

export type PanelMobileRow = {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  /** Badge corto a la derecha (ej. estado) */
  badge?: string;
  badgeTone?: "neutral" | "ok" | "warn" | "danger";
  /** Si hay href, navega en lugar de abrir detalle */
  href?: string;
  /** Contenido de la pantalla de detalle */
  detail?: ReactNode;
  show?: boolean;
};

type Props = {
  user: {
    nombre: string;
    email: string;
    image: string | null;
  };
  planLabel: string;
  statusLabel?: string;
  /** Turista no tiene BarrID; el resto vuelve a /barrid */
  showBackToBarrId: boolean;
  notices?: ReactNode;
  rows: PanelMobileRow[];
  /** Pie discreto (p. ej. eliminar cuenta Turista) */
  footer?: ReactNode;
};

const badgeClass: Record<NonNullable<PanelMobileRow["badgeTone"]>, string> = {
  neutral: "text-slate-500",
  ok: "text-emerald-700",
  warn: "text-amber-700",
  danger: "text-red-600",
};

const shellClass =
  "panel-mobile-shell flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none bg-[#27366D] text-slate-900";

/**
 * Panel mobile: mismo candado de viewport que MAPA/BarrID (100dvh + scroll interno)
 * para que el hub no se desacomode en standalone.
 */
export default function PanelMobile({
  user,
  planLabel,
  statusLabel,
  showBackToBarrId,
  notices,
  rows,
  footer,
}: Props) {
  useImmersiveScrollLock({ mobileOnly: true });
  const [activeId, setActiveId] = useState<string | null>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const detailScrollRef = useRef<HTMLDivElement>(null);
  const visibleRows = rows.filter((r) => r.show !== false);
  const active = visibleRows.find((r) => r.id === activeId) ?? null;

  useLayoutEffect(() => {
    const scroller = activeId ? detailScrollRef.current : listScrollRef.current;
    if (scroller) scroller.scrollTop = 0;
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeId]);

  if (active?.detail) {
    return (
      <div className={shellClass}>
        <header className="shrink-0 z-30 bg-[#27366D] text-white safe-area-top border-b border-[#1e2b58]">
          <div className="flex items-center gap-2 px-3 py-3">
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition touch-manipulation"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/90">
                Mi cuenta
              </p>
              <h1 className="text-base font-bold truncate leading-tight">{active.title}</h1>
            </div>
          </div>
        </header>
        <div
          ref={detailScrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-slate-50 px-4 py-4 pb-8 space-y-4"
        >
          {active.detail}
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <header className="shrink-0 z-30 bg-[#27366D] text-white safe-area-top border-b border-[#1e2b58]">
        <div className="flex items-center gap-2 px-3 py-3">
          {showBackToBarrId ? (
            <Link
              href="/barrid?ficha=1"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition touch-manipulation"
              aria-label="Volver a BarrID"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          ) : (
            <span className="w-10" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/90">
              {showBackToBarrId ? "Volver a BarrID" : "Mi cuenta"}
            </p>
            <h1 className="text-base font-bold truncate leading-tight">Ajustes</h1>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-white/15 transition touch-manipulation"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      </header>

      <div
        ref={listScrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-slate-50 px-4 py-4 pb-10 space-y-5"
      >
        <section className="flex items-center gap-3.5 rounded-2xl bg-white border border-slate-200 px-4 py-4 shadow-sm">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 shrink-0 border-2 border-amber-400/50">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.nombre}
                width={56}
                height={56}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#27366D]/10 text-[#27366D] font-bold text-lg">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-slate-950 truncate">{user.nombre}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <p className="text-[11px] font-semibold text-[#27366D] mt-1">
              {planLabel}
              {statusLabel ? (
                <span className="text-slate-400 font-normal"> · {statusLabel}</span>
              ) : null}
            </p>
          </div>
        </section>

        {notices ? <div className="space-y-3">{notices}</div> : null}

        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {visibleRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">Sin opciones disponibles.</p>
          ) : (
            visibleRows.map((row) => {
              const Icon = row.icon;
              const body = (
                <>
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#27366D]/8 text-[#27366D] shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-sm font-semibold text-slate-900">{row.title}</span>
                    {row.subtitle ? (
                      <span className="block text-[11px] text-slate-500 mt-0.5 truncate">
                        {row.subtitle}
                      </span>
                    ) : null}
                  </span>
                  {row.badge ? (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        badgeClass[row.badgeTone ?? "neutral"]
                      }`}
                    >
                      {row.badge}
                    </span>
                  ) : null}
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </>
              );

              if (row.href) {
                return (
                  <Link
                    key={row.id}
                    href={row.href}
                    className="flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 transition touch-manipulation"
                  >
                    {body}
                  </Link>
                );
              }

              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setActiveId(row.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 active:bg-slate-50 transition touch-manipulation"
                >
                  {body}
                </button>
              );
            })
          )}
        </section>

        {footer}
      </div>
    </div>
  );
}
