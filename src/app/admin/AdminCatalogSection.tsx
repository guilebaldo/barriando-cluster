"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Search, X } from "lucide-react";
import {
  updateCatalogSocioWebsite,
  type CatalogSocioRow,
} from "./actions";

export default function AdminCatalogSection({ rows }: { rows: CatalogSocioRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const haystack = [row.name, row.categoria, row.website, row.catalogUrl].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query]);

  function draftFor(row: CatalogSocioRow): string {
    return drafts[row.id] ?? row.website;
  }

  function setDraft(id: number, value: string) {
    setDrafts((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSave(row: CatalogSocioRow) {
    setMsg("");
    setSavingId(row.id);
    const website = draftFor(row).trim();
    const result = await updateCatalogSocioWebsite({ socioId: row.id, website });
    setSavingId(null);
    if (!result.ok) {
      setMsg(result.error ?? "Error al guardar.");
      return;
    }
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
    setMsg(`Sitio web de ${row.name} actualizado.`);
    router.refresh();
  }

  async function handleReset(row: CatalogSocioRow) {
    setMsg("");
    setSavingId(row.id);
    const result = await updateCatalogSocioWebsite({ socioId: row.id, website: "" });
    setSavingId(null);
    if (!result.ok) {
      setMsg(result.error ?? "Error al restablecer.");
      return;
    }
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
    setMsg(`Sitio web de ${row.name} restablecido al catálogo.`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">
          Sitios web del catálogo
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-light">
          Edita el enlace “Sitio web” de la ficha en /socios para socios del catálogo estático. Vacío +
          restablecer vuelve al URL original del catálogo.
        </p>
      </div>

      {msg ? (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {msg}
        </p>
      ) : null}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, categoría o URL…"
              className="w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#27366D]/20 focus:border-[#27366D]"
              aria-label="Buscar socios del catálogo"
            />
            {query.trim() ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
          <p className="text-[11px] text-slate-500 shrink-0">
            {visible.length} de {rows.length} socios
            {query.trim() ? " encontrados" : ""}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Negocio</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 min-w-[16rem]">Sitio web</th>
                <th className="px-4 py-3 w-40 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    {query.trim()
                      ? "No hay socios que coincidan con tu búsqueda."
                      : "No hay socios en el catálogo."}
                  </td>
                </tr>
              ) : (
                visible.map((row) => {
                  const draft = draftFor(row);
                  const dirty = draft.trim() !== row.website.trim();
                  const saving = savingId === row.id;
                  return (
                    <tr key={row.id} className="border-b border-slate-100 align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{row.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">id {row.id}</p>
                        {row.hasOverride ? (
                          <p className="text-[10px] text-amber-700 mt-1 font-medium">Override activo</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.categoria}</td>
                      <td className="px-4 py-3">
                        <input
                          type="url"
                          value={draft}
                          onChange={(e) => setDraft(row.id, e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#27366D]/20 focus:border-[#27366D]"
                          placeholder="https://…"
                        />
                        {row.hasOverride ? (
                          <p className="text-[10px] text-slate-400 mt-1 truncate" title={row.catalogUrl}>
                            Catálogo: {row.catalogUrl}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-col items-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleSave(row)}
                            disabled={saving || !dirty}
                            className="bg-[#27366D] hover:bg-[#1e2b58] disabled:opacity-40 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition"
                          >
                            {saving ? "…" : "Guardar"}
                          </button>
                          {row.hasOverride ? (
                            <button
                              type="button"
                              onClick={() => void handleReset(row)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 disabled:opacity-40"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Restablecer
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
