"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/** Compact window so prev + pages + next fit on one mobile row. */
function pageItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current]);
  if (current - 1 >= 1) pages.add(current - 1);
  if (current + 1 <= total) pages.add(current + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev > 0 && p - prev > 1) items.push("ellipsis");
    items.push(p);
    prev = p;
  }
  return items;
}

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function AdminPagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const items = pageItems(page, totalPages);

  return (
    <nav
      className="flex flex-nowrap items-center justify-center gap-0.5 sm:gap-1 border-t border-slate-200 px-2 sm:px-3 py-2.5 sm:py-3 bg-slate-50/80 overflow-x-auto"
      aria-label="Paginación"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex items-center gap-0.5 shrink-0 px-1.5 sm:px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:bg-white hover:text-[#27366D] disabled:opacity-35 disabled:hover:bg-transparent"
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      {items.map((item, idx) =>
        item === "ellipsis" ? (
          <span
            key={`e-${idx}`}
            className="px-0.5 sm:px-1.5 py-1.5 text-[11px] sm:text-xs text-slate-400 select-none shrink-0"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-label={`Ir a página ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={`shrink-0 min-w-[1.75rem] sm:min-w-[2rem] px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold tabular-nums transition ${
              item === page
                ? "bg-[#27366D] text-white shadow-sm"
                : "text-slate-600 hover:bg-white hover:text-[#27366D]"
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex items-center gap-0.5 shrink-0 px-1.5 sm:px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:bg-white hover:text-[#27366D] disabled:opacity-35 disabled:hover:bg-transparent"
        aria-label="Página siguiente"
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </nav>
  );
}
