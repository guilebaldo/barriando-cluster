"use client";

import Link from "next/link";
import type { PanelMobileRow } from "./PanelMobile";

const badgeClass: Record<NonNullable<PanelMobileRow["badgeTone"]>, string> = {
  neutral: "text-slate-500",
  ok: "text-emerald-700",
  warn: "text-amber-700",
  danger: "text-red-600",
};

type Props = {
  rows: PanelMobileRow[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

/** Navegación de secciones del panel en escritorio (mismas filas que móvil). */
export default function PanelDesktopNav({ rows, activeId, onSelect }: Props) {
  const visible = rows.filter((r) => r.show !== false);
  if (visible.length === 0) return null;

  return (
    <nav
      aria-label="Secciones de la cuenta"
      className="w-56 shrink-0 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
    >
      <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Secciones
      </p>
      <ul className="space-y-0.5">
        {visible.map((row) => {
          const Icon = row.icon;
          const selected = !row.href && row.id === activeId;
          const className = `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${
            selected
              ? "bg-[#27366D] text-white"
              : "text-slate-700 hover:bg-slate-50"
          }`;
          const body = (
            <>
              <Icon className={`w-4 h-4 shrink-0 ${selected ? "text-amber-300" : "text-[#27366D]"}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold leading-tight">{row.title}</span>
                {row.badge ? (
                  <span
                    className={`mt-0.5 block text-[10px] font-bold uppercase tracking-wider ${
                      selected ? "text-amber-200/90" : badgeClass[row.badgeTone ?? "neutral"]
                    }`}
                  >
                    {row.badge}
                  </span>
                ) : null}
              </span>
            </>
          );

          return (
            <li key={row.id}>
              {row.href ? (
                <Link href={row.href} className={className}>
                  {body}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(row.id)}
                  aria-current={selected ? "page" : undefined}
                  className={className}
                >
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
