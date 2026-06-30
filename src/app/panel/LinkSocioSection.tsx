"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Link2, Search } from "lucide-react";
import { linkSocioAccount, registerManualBusiness } from "./actions";
import BusinessPlacesAutocomplete from "./BusinessPlacesAutocomplete";
import { BUSINESS_CATEGORY_OPTIONS } from "@/lib/business-categories";
import { REGIMEN_OPTIONS, CFDI_OPTIONS } from "@/lib/fiscal-options";
import { normalizeWebsiteUrl } from "@/lib/url-utils";
import {
  formFieldInputClass,
  formFieldLabelClass,
  formFieldLegendClass,
  formFieldSelectClass,
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
  onLinked: () => Promise<void>;
}

export default function LinkSocioSection({ socios, takenSocioIds, onLinked }: LinkSocioSectionProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [linkMsg, setLinkMsg] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualLat, setManualLat] = useState<number | null>(null);
  const [manualLng, setManualLng] = useState<number | null>(null);
  const [manualCategory, setManualCategory] = useState("");
  const [manualWebsite, setManualWebsite] = useState("");
  const [manualRfc, setManualRfc] = useState("");
  const [manualRazonSocial, setManualRazonSocial] = useState("");
  const [manualRegimen, setManualRegimen] = useState("");
  const [manualUsoCfdi, setManualUsoCfdi] = useState("");
  const [manualCodigoPostal, setManualCodigoPostal] = useState("");
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

  const selectedLabel = useMemo(() => {
    if (selectedId === NOT_LISTED_ID) return "Mi negocio no está listado";
    if (selectedId == null) return "";
    const found = socios.find((s) => s.id === selectedId);
    return found ? `${found.name} — ${found.categoria}` : "";
  }, [selectedId, socios]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function pickOption(id: number, label: string) {
    setSelectedId(id);
    setQuery(label);
    setOpen(false);
    setLinkMsg("");
  }

  async function handleSubmit() {
    setLinkMsg("");
    setLinkLoading(true);

    try {
      if (isManual) {
        const result = await registerManualBusiness({
          businessName: manualName,
          address: manualAddress,
          category: manualCategory,
          website: manualWebsite ? normalizeWebsiteUrl(manualWebsite) : undefined,
          latitude: manualLat,
          longitude: manualLng,
          rfc: manualRfc,
          razonSocial: manualRazonSocial,
          regimenFiscal: manualRegimen,
          usoCfdi: manualUsoCfdi,
          billingCodigoPostal: manualCodigoPostal,
        });
        if (!result.ok) {
          setLinkMsg(result.error);
          return;
        }
        setLinkMsg(
          `Solicitud enviada para "${result.socioName}". Quedó pendiente de aprobación del administrador.`
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
        `Solicitud enviada para "${result.socioName}". Quedó pendiente de aprobación del administrador.`
      );
      setSelectedId(null);
      setQuery("");
      await onLinked();
    } finally {
      setLinkLoading(false);
    }
  }

  const inputClass = formFieldInputClass;

  return (
    <section className="bg-white border border-amber-200 rounded-xl p-6 shadow-sm md:col-span-2">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-5 h-5 text-amber-600" />
        <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">Vincula tu negocio</h2>
      </div>
      <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
        Busca tu establecimiento en la lista. Si no lo encuentras, desplázate hasta el final y selecciona
        la opción <strong className="text-[#27366D]">&quot;Mi negocio no está listado&quot;</strong> para
        registrarlo desde cero con ubicación precisa y datos fiscales.
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
              placeholder="Escribe para buscar por nombre o categoría..."
              className={`${inputClass} pl-9 pr-9`}
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

        {open && (
          <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg text-xs">
            {available.length === 0 && (
              <li className="px-3 py-2 text-slate-500">No hay coincidencias en el catálogo.</li>
            )}
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
                  <span className="font-semibold text-slate-900">{s.name}</span>
                  <span className="text-slate-500 ml-2">{s.categoria}</span>
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => pickOption(NOT_LISTED_ID, "Mi negocio no está listado")}
                className={`w-full text-left px-3 py-2.5 border-t border-amber-100 transition ${
                  isManual
                    ? "bg-amber-100 text-amber-900 font-semibold border-l-2 border-l-amber-600"
                    : "hover:bg-amber-50 text-amber-800 font-semibold"
                }`}
              >
                Mi negocio no está listado
              </button>
            </li>
          </ul>
        )}
      </div>

      {selectedId != null && !isManual && selectedLabel && (
        <p className="text-xs text-slate-600 mb-3">
          Seleccionado: <strong className="text-[#27366D]">{selectedLabel}</strong>
        </p>
      )}

      {isManual && (
        <div className="grid sm:grid-cols-2 gap-3 mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <label className={`${formFieldLabelClass} sm:col-span-2`}>
            <span className={formFieldLegendClass}>Nombre del negocio</span>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              className={`${inputClass} mt-1`}
              placeholder="Ej. Café del Centro"
            />
          </label>
          <label className={`${formFieldLabelClass} sm:col-span-2`}>
            <span className={formFieldLegendClass}>Ubicación (Google Places)</span>
            <BusinessPlacesAutocomplete
              value={manualAddress}
              onChange={setManualAddress}
              onLocationSelected={(loc) => {
                setManualAddress(loc.address);
                setManualLat(loc.latitude);
                setManualLng(loc.longitude);
              }}
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Giro del negocio</span>
            <select
              value={manualCategory}
              onChange={(e) => setManualCategory(e.target.value)}
              className={`${formFieldSelectClass} mt-1`}
            >
              <option value="">Selecciona…</option>
              {BUSINESS_CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {manualCategory && (
              <p className="text-[10px] text-[#27366D] mt-1 font-medium">Seleccionado: {manualCategory}</p>
            )}
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Sitio web (opcional)</span>
            <input
              type="text"
              value={manualWebsite}
              onChange={(e) => setManualWebsite(e.target.value)}
              onBlur={() => setManualWebsite((v) => normalizeWebsiteUrl(v))}
              className={`${inputClass} mt-1`}
              placeholder="tunegocio.com"
            />
          </label>

          <div className="sm:col-span-2 pt-2 border-t border-slate-200">
            <p className="text-[10px] font-bold text-[#27366D] uppercase tracking-widest mb-3">
              Datos fiscales (CFDI 4.0)
            </p>
          </div>

          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>RFC</span>
            <input
              type="text"
              value={manualRfc}
              onChange={(e) => setManualRfc(e.target.value.toUpperCase())}
              className={`${inputClass} mt-1 uppercase`}
              maxLength={13}
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Razón social</span>
            <input
              type="text"
              value={manualRazonSocial}
              onChange={(e) => setManualRazonSocial(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Régimen fiscal</span>
            <select
              value={manualRegimen}
              onChange={(e) => setManualRegimen(e.target.value)}
              className={`${formFieldSelectClass} mt-1`}
            >
              <option value="">Selecciona…</option>
              {REGIMEN_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Uso de CFDI</span>
            <select
              value={manualUsoCfdi}
              onChange={(e) => setManualUsoCfdi(e.target.value)}
              className={`${formFieldSelectClass} mt-1`}
            >
              <option value="">Selecciona…</option>
              {CFDI_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Código postal fiscal</span>
            <input
              type="text"
              value={manualCodigoPostal}
              onChange={(e) => setManualCodigoPostal(e.target.value)}
              className={`${inputClass} mt-1`}
              maxLength={10}
              inputMode="numeric"
            />
          </label>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={linkLoading || (selectedId == null && !query.trim())}
        className="bg-[#27366D] text-white font-bold text-xs uppercase px-6 py-3 rounded-lg disabled:opacity-50 hover:bg-[#1e2b58] transition"
      >
        {linkLoading ? "Enviando solicitud..." : isManual ? "Enviar solicitud de alta" : "Solicitar vinculación"}
      </button>

      {linkMsg && <p className="text-xs mt-3 text-slate-600">{linkMsg}</p>}
    </section>
  );
}
