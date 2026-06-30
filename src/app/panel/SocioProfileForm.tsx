"use client";

import { useCallback, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { updateSocioProfile } from "./actions";
import GmbPlacesAutocomplete from "./GmbPlacesAutocomplete";
import { REGIMEN_OPTIONS, CFDI_OPTIONS } from "@/lib/fiscal-options";
import { normalizeWebsiteUrl } from "@/lib/url-utils";
import {
  formFieldInputClass,
  formFieldLabelClass,
  formFieldLegendClass,
  formFieldSelectClass,
} from "@/lib/form-field-styles";

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
  /** Sin borde/título propio: se integra en la vista de control del negocio. */
  embedded?: boolean;
}

export default function SocioProfileForm({
  initial,
  disabled,
  hideBusinessName,
  embedded = false,
}: SocioProfileFormProps) {
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
    setMsg("Cambios guardados correctamente.");
  }

  const formBody = (
    <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
      {!hideBusinessName && (
        <label className={`${formFieldLabelClass} sm:col-span-2`}>
          <span className={formFieldLegendClass}>Nombre del negocio</span>
          <input
            type="text"
            required
            disabled={disabled || loading}
            value={form.businessName}
            onChange={(e) => set("businessName", e.target.value)}
            className={`${formFieldInputClass} mt-1`}
          />
        </label>
      )}
      <label className={formFieldLabelClass}>
        <span className={formFieldLegendClass}>Sitio web</span>
        <input
          type="text"
          required
          disabled={disabled || loading}
          value={form.website}
          onChange={(e) => set("website", e.target.value)}
          onBlur={() => normalizeUrlField("website")}
          placeholder="tunegocio.com"
          className={`${formFieldInputClass} mt-1`}
        />
      </label>
      <label className={`${formFieldLabelClass} sm:col-span-2`}>
        <span className={formFieldLegendClass}>Google My Business</span>
        <GmbPlacesAutocomplete
          value={gmbLabel || form.googleBusinessUrl}
          onChange={setGmbLabel}
          onPlaceSelected={(parsed) => {
            setGmbLabel(parsed.label);
            set("googleBusinessUrl", parsed.googleBusinessUrl);
          }}
          disabled={disabled || loading}
          className={`${formFieldInputClass} mt-1`}
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

      <label className={formFieldLabelClass}>
        <span className={formFieldLegendClass}>RFC</span>
        <input
          type="text"
          required
          disabled={disabled || loading}
          value={form.rfc}
          onChange={(e) => set("rfc", e.target.value.toUpperCase())}
          className={`${formFieldInputClass} mt-1 uppercase`}
          maxLength={13}
        />
      </label>
      <label className={formFieldLabelClass}>
        <span className={formFieldLegendClass}>Razón social</span>
        <input
          type="text"
          required
          disabled={disabled || loading}
          value={form.razonSocial}
          onChange={(e) => set("razonSocial", e.target.value)}
          className={`${formFieldInputClass} mt-1`}
        />
      </label>
      <label className={formFieldLabelClass}>
        <span className={formFieldLegendClass}>Régimen fiscal</span>
        <select
          required
          disabled={disabled || loading}
          value={form.regimenFiscal}
          onChange={(e) => set("regimenFiscal", e.target.value)}
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
          required
          disabled={disabled || loading}
          value={form.usoCfdi}
          onChange={(e) => set("usoCfdi", e.target.value)}
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
          required
          disabled={disabled || loading}
          value={form.billingCodigoPostal}
          onChange={(e) => set("billingCodigoPostal", e.target.value)}
          className={`${formFieldInputClass} mt-1`}
          maxLength={10}
          inputMode="numeric"
        />
      </label>

      <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
        <button
          type="submit"
          disabled={disabled || loading || !isDirty}
          className="inline-flex items-center gap-2 bg-[#27366D] hover:bg-[#1e2b58] active:scale-95 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg disabled:opacity-40 transition-all"
        >
          <Save className="w-4 h-4" />
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
        {msg && <p className="text-xs text-slate-600">{msg}</p>}
        {isDirty && !msg && (
          <p className="text-[10px] text-amber-700">Tienes cambios sin guardar</p>
        )}
      </div>
    </form>
  );

  if (embedded) {
    return formBody;
  }

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm md:col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
          Perfil del negocio y facturación (CFDI 4.0)
        </h2>
      </div>
      {formBody}
    </section>
  );
}
