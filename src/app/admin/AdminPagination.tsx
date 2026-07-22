"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

function pageItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total]);
  for (let i = current - 2; i <= current + 2; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }

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
      className="flex flex-wrap items-center justify-center gap-1 border-t border-slate-200 px-3 py-3 bg-slate-50/80"
      aria-label="Paginación"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:bg-white hover:text-[#27366D] disabled:opacity-35 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Anterior
      </button>

      {items.map((item, idx) =>
        item === "ellipsis" ? (
          <span
            key={`e-${idx}`}
            className="px-1.5 py-1.5 text-xs text-slate-400 select-none"
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
            className={`min-w-[2rem] px-2 py-1.5 rounded-lg text-xs font-semibold tabular-nums transition ${
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
        className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:bg-white hover:text-[#27366D] disabled:opacity-35 disabled:hover:bg-transparent"
      >
        Siguiente
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </nav>
  );
}
