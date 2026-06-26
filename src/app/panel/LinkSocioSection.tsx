"use client";

import { useMemo, useState } from "react";
import { Link2 } from "lucide-react";
import { linkSocioAccount } from "./actions";

interface SocioOption {
  id: number;
  name: string;
  categoria: string;
}

interface LinkSocioSectionProps {
  socios: SocioOption[];
  takenSocioIds: number[];
  onLinked: () => Promise<void>;
}

export default function LinkSocioSection({ socios, takenSocioIds, onLinked }: LinkSocioSectionProps) {
  const [search, setSearch] = useState("");
  const [linkSocioId, setLinkSocioId] = useState("");
  const [linkMsg, setLinkMsg] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);

  const available = useMemo(() => {
    const taken = new Set(takenSocioIds);
    const q = search.trim().toLowerCase();
    return socios.filter((s) => {
      if (taken.has(s.id)) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.categoria.toLowerCase().includes(q) ||
        String(s.id).includes(q)
      );
    });
  }, [socios, takenSocioIds, search]);

  async function handleLinkSocio() {
    if (!linkSocioId) return;
    setLinkLoading(true);
    setLinkMsg("");
    const result = await linkSocioAccount(Number(linkSocioId));
    setLinkLoading(false);
    if (!result.ok) {
      setLinkMsg(result.error);
      return;
    }
    setLinkMsg(`¡Vinculado con ${result.socioName}! Plan asignado: ${result.planLabel}.`);
    setLinkSocioId("");
    setSearch("");
    await onLinked();
  }

  return (
    <section className="bg-white border border-amber-200 rounded-xl p-6 shadow-sm md:col-span-2">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-5 h-5 text-amber-600" />
        <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">Vincula tu negocio</h2>
      </div>
      <p className="text-[11px] text-slate-500 mb-3">
        Cada negocio del catálogo solo puede certificarse una vez. Los ya vinculados no aparecen en la lista.
      </p>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, categoría o ID..."
        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs mb-3"
      />
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={linkSocioId}
          onChange={(e) => setLinkSocioId(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs"
        >
          <option value="">
            {available.length === 0 ? "No hay negocios disponibles" : "Selecciona tu negocio..."}
          </option>
          {available.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.categoria}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleLinkSocio}
          disabled={!linkSocioId || linkLoading}
          className="bg-[#27366D] text-white font-bold text-xs uppercase px-6 py-3 rounded-lg disabled:opacity-50"
        >
          {linkLoading ? "Vinculando..." : "Vincular"}
        </button>
      </div>
      {linkMsg && <p className="text-xs mt-3 text-slate-600">{linkMsg}</p>}
    </section>
  );
}
