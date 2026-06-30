"use client";

import { useCallback, useMemo, useState } from "react";
import { Building2, Save } from "lucide-react";
import { updateSocioProfile } from "./actions";
import GmbPlacesAutocomplete from "./GmbPlacesAutocomplete";
import { REGIMEN_OPTIONS, CFDI_OPTIONS } from "@/lib/fiscal-options";
import { normalizeWebsiteUrl } from "@/lib/url-utils";

export interface SocioProfileFormInitial {
  businessName: string;
  website: string;
  googleBusinessUrl: string;
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  usoCfdi: string;
  billingCodigoPostal: string;
}

interface SocioProfileFormProps {
  initial: SocioProfileFormInitial;
  disabled?: boolean;
  hideBusinessName?: boolean;
}

export default function SocioProfileForm({ initial, disabled, hideBusinessName }: SocioProfileFormProps) {
  const [form, setForm] = useState(initial);
  const [gmbLabel, setGmbLabel] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial]
  );

  const set = (key: keyof SocioProfileFormInitial, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const normalizeUrlField = useCallback((key: "website" | "googleBusinessUrl") => {
    setForm((prev) => ({ ...prev, [key]: normalizeWebsiteUrl(prev[key]) }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty) return;
    setMsg("");
    setLoading(true);
    const payload = {
      ...form,
      website: normalizeWebsiteUrl(form.website),
      googleBusinessUrl: normalizeWebsiteUrl(form.googleBusinessUrl),
    };
    const result = await updateSocioProfile(payload);
    setLoading(false);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setForm(payload);
    setMsg("Perfil y datos fiscales guardados correctamente.");
  }

  const inputClass =
    "w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#27366D]/20";

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm md:col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-4 h-4 text-[#27366D]" />
        <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
          Perfil del negocio y facturación (CFDI 4.0)
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
        {!hideBusinessName && (
          <label className="block sm:col-span-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Nombre del negocio
            </span>
            <input
              type="text"
              required
              disabled={disabled || loading}
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
        )}
        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sitio web</span>
          <input
            type="text"
            required
            disabled={disabled || loading}
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            onBlur={() => normalizeUrlField("website")}
            placeholder="tunegocio.com"
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Google My Business
          </span>
          <GmbPlacesAutocomplete
            value={gmbLabel || form.googleBusinessUrl}
            onChange={setGmbLabel}
            onPlaceSelected={(parsed) => {
              setGmbLabel(parsed.label);
              set("googleBusinessUrl", parsed.googleBusinessUrl);
            }}
            disabled={disabled || loading}
            className={`${inputClass} mt-1`}
          />
          {form.googleBusinessUrl && (
            <p className="text-[10px] text-slate-400 mt-1 truncate">{form.googleBusinessUrl}</p>
          )}
        </label>

        <div className="sm:col-span-2 pt-2 border-t border-slate-100">
          <p className="text-[10px] font-bold text-[#27366D] uppercase tracking-widest mb-1">
            Domicilio fiscal
          </p>
          <p className="text-[10px] text-slate-400 font-light">
            Solo el código postal fiscal. La ubicación del negocio se gestiona aparte.
          </p>
        </div>

        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">RFC</span>
          <input
            type="text"
            required
            disabled={disabled || loading}
            value={form.rfc}
            onChange={(e) => set("rfc", e.target.value.toUpperCase())}
            className={`${inputClass} mt-1 uppercase`}
            maxLength={13}
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Razón social
          </span>
          <input
            type="text"
            required
            disabled={disabled || loading}
            value={form.razonSocial}
            onChange={(e) => set("razonSocial", e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Régimen fiscal
          </span>
          <select
            required
            disabled={disabled || loading}
            value={form.regimenFiscal}
            onChange={(e) => set("regimenFiscal", e.target.value)}
            className={`${inputClass} mt-1`}
          >
            <option value="">Selecciona…</option>
            {REGIMEN_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Uso de CFDI
          </span>
          <select
            required
            disabled={disabled || loading}
            value={form.usoCfdi}
            onChange={(e) => set("usoCfdi", e.target.value)}
            className={`${inputClass} mt-1`}
          >
            <option value="">Selecciona…</option>
            {CFDI_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Código postal fiscal
          </span>
          <input
            type="text"
            required
            disabled={disabled || loading}
            value={form.billingCodigoPostal}
            onChange={(e) => set("billingCodigoPostal", e.target.value)}
            className={`${inputClass} mt-1`}
            maxLength={10}
            inputMode="numeric"
          />
        </label>

        {isDirty && (
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={disabled || loading}
              className="inline-flex items-center gap-2 bg-[#27366D] hover:bg-[#1e2b58] active:scale-95 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
            {msg && <p className="text-xs text-slate-600">{msg}</p>}
          </div>
        )}
        {!isDirty && msg && <p className="sm:col-span-2 text-xs text-slate-600">{msg}</p>}
      </form>
    </section>
  );
}
