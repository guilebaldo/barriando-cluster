"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Link2, Search } from "lucide-react";
import { linkSocioAccount, registerManualBusiness } from "./actions";
import BusinessProfileFields from "./BusinessProfileFields";
import type { SocioProfileFormInitial } from "./business-profile-types";
import { emptyBusinessProfile } from "@/lib/business-address";
import {
  formFieldInputClass,
  formFieldLabelClass,
  formFieldLegendClass,
} from "@/lib/form-field-styles";

const NOT_LISTED_ID = -1;

interface SocioOption {
  id: number;
  name: string;
  categoria: string;
}

interface LinkSocioSectionProps {
  socios: SocioOption[];
  takenSocioIds: number[];
  accountEmail: string;
  onLinked: () => Promise<void>;
}

export default function LinkSocioSection({
  socios,
  takenSocioIds,
  accountEmail,
  onLinked,
}: LinkSocioSectionProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [linkMsg, setLinkMsg] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [manualForm, setManualForm] = useState<SocioProfileFormInitial>(() =>
    emptyBusinessProfile(accountEmail)
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const isManual = selectedId === NOT_LISTED_ID;

  const available = useMemo(() => {
    const taken = new Set(takenSocioIds);
    const q = query.trim().toLowerCase();
    return socios.filter((s) => {
      if (taken.has(s.id)) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.categoria.toLowerCase().includes(q) ||
        String(s.id).includes(q)
      );
    });
  }, [socios, takenSocioIds, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setManualForm((prev) => ({
      ...prev,
      contactEmail: prev.contactEmail || accountEmail,
    }));
  }, [accountEmail]);

  function pickOption(id: number, label: string) {
    setSelectedId(id);
    setQuery(label);
    setOpen(false);
    setLinkMsg("");
  }

  const setManual = <K extends keyof SocioProfileFormInitial>(
    key: K,
    value: SocioProfileFormInitial[K]
  ) => setManualForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setLinkMsg("");
    setLinkLoading(true);

    try {
      if (isManual) {
        if (!manualForm.privacyAccepted) {
          setLinkMsg("Debes aceptar el aviso de privacidad.");
          return;
        }
        if (manualForm.latitude == null || manualForm.longitude == null) {
          setLinkMsg("Confirma la ubicación en el mapa.");
          return;
        }
        const result = await registerManualBusiness(manualForm);
        if (!result.ok) {
          setLinkMsg(result.error);
          return;
        }
        setLinkMsg(
          `Solicitud enviada para «${result.socioName}». Quedó pendiente de aprobación del administrador.`
        );
        await onLinked();
        return;
      }

      if (selectedId == null || selectedId === NOT_LISTED_ID) {
        setLinkMsg("Selecciona un negocio de la lista.");
        return;
      }

      const result = await linkSocioAccount(selectedId);
      if (!result.ok) {
        setLinkMsg(result.error);
        return;
      }
      setLinkMsg(
        `Solicitud enviada para «${result.socioName}». Quedó pendiente de aprobación del administrador.`
      );
      setSelectedId(null);
      setQuery("");
      await onLinked();
    } finally {
      setLinkLoading(false);
    }
  }

  return (
    <section className="bg-white border border-amber-200 rounded-xl p-6 shadow-sm md:col-span-2">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-5 h-5 text-amber-600" />
        <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
          Vincula tu negocio
        </h2>
      </div>
      <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
        Busca tu establecimiento en la lista. Si no lo encuentras, elige{" "}
        <strong className="text-[#27366D]">«Mi negocio no está listado»</strong> para registrarlo
        con ubicación y datos fiscales. Puedes completar el alta aunque tu pago aún esté pendiente.
      </p>

      <div ref={containerRef} className="relative mb-4">
        <label className={formFieldLabelClass}>
          <span className={formFieldLegendClass}>Buscar negocio en el catálogo</span>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedId(null);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Escribe para buscar por nombre o categoría…"
              className={`${formFieldInputClass} pl-9 pr-9`}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              aria-label="Abrir lista"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </label>

        {open ? (
          <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg text-sm">
            {available.length === 0 ? (
              <li className="px-3 py-2 text-slate-500">No hay coincidencias en el catálogo.</li>
            ) : null}
            {available.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => pickOption(s.id, `${s.name} — ${s.categoria}`)}
                  className={`w-full text-left px-3 py-2.5 border-b border-slate-50 last:border-0 transition ${
                    selectedId === s.id
                      ? "bg-[#27366D]/10 border-l-2 border-l-[#27366D] font-semibold"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {s.name} — {s.categoria}
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => pickOption(NOT_LISTED_ID, "Mi negocio no está listado")}
                className={`w-full text-left px-3 py-2.5 font-semibold transition ${
                  selectedId === NOT_LISTED_ID
                    ? "bg-amber-50 text-amber-900"
                    : "hover:bg-amber-50/80 text-[#27366D]"
                }`}
              >
                Mi negocio no está listado
              </button>
            </li>
          </ul>
        ) : null}
      </div>

      {isManual ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          <BusinessProfileFields
            form={manualForm}
            set={setManual}
            disabled={linkLoading}
            requireFiscal
            requirePrivacy
          />
          <button
            type="submit"
            disabled={linkLoading}
            className="bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg disabled:opacity-40"
          >
            {linkLoading ? "Enviando…" : "Enviar solicitud de registro"}
          </button>
        </form>
      ) : (
        <button
          type="button"
          disabled={linkLoading || selectedId == null}
          onClick={() => void handleSubmit()}
          className="bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg disabled:opacity-40"
        >
          {linkLoading ? "Enviando…" : "Vincular negocio del catálogo"}
        </button>
      )}

      {linkMsg ? (
        <p className="mt-4 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          {linkMsg}
        </p>
      ) : null}
    </section>
  );
}
