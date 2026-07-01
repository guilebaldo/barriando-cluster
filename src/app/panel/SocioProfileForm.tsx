"use client";

import { useCallback, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { updateSocioProfile } from "./actions";
import BusinessPlacesAutocomplete from "./BusinessPlacesAutocomplete";
import BillingPlacesAutocomplete, { type ParsedBillingAddress } from "./BillingPlacesAutocomplete";
import { BUSINESS_CATEGORY_OPTIONS, categorySelectOptions } from "@/lib/business-categories";
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
  category: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  usoCfdi: string;
  billingStreet: string;
  billingColonia: string;
  billingCiudad: string;
  billingEstado: string;
  billingPais: string;
  billingCodigoPostal: string;
  billingAddressFull: string;
}

interface SocioProfileFormProps {
  initial: SocioProfileFormInitial;
  email: string;
  disabled?: boolean;
  hideBusinessName?: boolean;
  embedded?: boolean;
}

export default function SocioProfileForm({
  initial,
  email,
  disabled,
  hideBusinessName,
  embedded = false,
}: SocioProfileFormProps) {
  const [form, setForm] = useState(initial);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial]
  );

  const set = <K extends keyof SocioProfileFormInitial>(key: K, value: SocioProfileFormInitial[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const applyBilling = useCallback((parsed: ParsedBillingAddress) => {
    setForm((prev) => ({
      ...prev,
      billingStreet: parsed.billingStreet,
      billingColonia: parsed.billingColonia,
      billingCiudad: parsed.billingCiudad,
      billingEstado: parsed.billingEstado,
      billingPais: parsed.billingPais,
      billingCodigoPostal: parsed.billingCodigoPostal,
      billingAddressFull: parsed.billingAddressFull,
    }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty) return;
    setMsg("");
    setLoading(true);
    const payload = {
      ...form,
      website: form.website.trim() ? normalizeWebsiteUrl(form.website) : "",
      googleBusinessUrl: form.googleBusinessUrl.trim()
        ? normalizeWebsiteUrl(form.googleBusinessUrl)
        : "",
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

  const categoryOptions = useMemo(() => categorySelectOptions(form.category), [form.category]);

  const formBody = (
    <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
      <label className={`${formFieldLabelClass} sm:col-span-2`}>
        <span className={formFieldLegendClass}>Correo registrado</span>
        <input
          type="email"
          readOnly
          value={email}
          className={`${formFieldInputClass} mt-1 bg-slate-100 text-slate-500 cursor-not-allowed`}
        />
      </label>

      {!hideBusinessName && (
        <label className={`${formFieldLabelClass} sm:col-span-2`}>
          <span className={formFieldLegendClass}>Nombre del negocio *</span>
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
        <span className={formFieldLegendClass}>Categoría *</span>
        <select
          required
          disabled={disabled || loading}
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
          className={`${formFieldSelectClass} mt-1`}
        >
          <option value="">Selecciona…</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className={formFieldLabelClass}>
        <span className={formFieldLegendClass}>Sitio web o red social (opcional)</span>
        <input
          type="text"
          disabled={disabled || loading}
          value={form.website}
          onChange={(e) => set("website", e.target.value)}
          onBlur={() =>
            set("website", form.website.trim() ? normalizeWebsiteUrl(form.website) : "")
          }
          placeholder="instagram.com/tunegocio"
          className={`${formFieldInputClass} mt-1`}
        />
      </label>

      <label className={`${formFieldLabelClass} sm:col-span-2`}>
        <span className={formFieldLegendClass}>Ubicación del negocio (Google Maps) *</span>
        <p className="text-[10px] text-slate-400 font-light mt-0.5 mb-1">
          Busca tu establecimiento. Se usa para la ficha pública y, con plan Gran Empresa, para el MAP.
        </p>
        <BusinessPlacesAutocomplete
          value={form.address}
          onChange={(v) => {
            set("address", v);
            if (!v.trim()) {
              setForm((prev) => ({
                ...prev,
                address: "",
                googleBusinessUrl: "",
                latitude: null,
                longitude: null,
              }));
            }
          }}
          onLocationSelected={(loc) => {
            setForm((prev) => ({
              ...prev,
              address: loc.address,
              latitude: loc.latitude,
              longitude: loc.longitude,
              googleBusinessUrl: loc.mapsUrl ?? prev.googleBusinessUrl,
            }));
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
          Domicilio fiscal (CFDI 4.0)
        </p>
        <p className="text-[10px] text-slate-400 font-light">
          Distinto a la ubicación del negocio. Busca la dirección fiscal para completar calle, colonia y C.P.
        </p>
      </div>

      <label className={`${formFieldLabelClass} sm:col-span-2`}>
        <span className={formFieldLegendClass}>Dirección fiscal *</span>
        <BillingPlacesAutocomplete
          value={form.billingAddressFull}
          onChange={(v) => set("billingAddressFull", v)}
          onAddressSelected={applyBilling}
          disabled={disabled || loading}
          className={`${formFieldInputClass} mt-1`}
        />
      </label>

      <label className={formFieldLabelClass}>
        <span className={formFieldLegendClass}>Calle y número</span>
        <input
          type="text"
          disabled={disabled || loading}
          value={form.billingStreet}
          onChange={(e) => set("billingStreet", e.target.value)}
          className={`${formFieldInputClass} mt-1`}
        />
      </label>
      <label className={formFieldLabelClass}>
        <span className={formFieldLegendClass}>Colonia</span>
        <input
          type="text"
          disabled={disabled || loading}
          value={form.billingColonia}
          onChange={(e) => set("billingColonia", e.target.value)}
          className={`${formFieldInputClass} mt-1`}
        />
      </label>
      <label className={formFieldLabelClass}>
        <span className={formFieldLegendClass}>Ciudad</span>
        <input
          type="text"
          disabled={disabled || loading}
          value={form.billingCiudad}
          onChange={(e) => set("billingCiudad", e.target.value)}
          className={`${formFieldInputClass} mt-1`}
        />
      </label>
      <label className={formFieldLabelClass}>
        <span className={formFieldLegendClass}>Estado</span>
        <input
          type="text"
          disabled={disabled || loading}
          value={form.billingEstado}
          onChange={(e) => set("billingEstado", e.target.value)}
          className={`${formFieldInputClass} mt-1`}
        />
      </label>
      <label className={formFieldLabelClass}>
        <span className={formFieldLegendClass}>Código postal *</span>
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
      <label className={formFieldLabelClass}>
        <span className={formFieldLegendClass}>País</span>
        <input
          type="text"
          disabled={disabled || loading}
          value={form.billingPais}
          onChange={(e) => set("billingPais", e.target.value)}
          className={`${formFieldInputClass} mt-1`}
        />
      </label>

      <label className={formFieldLabelClass}>
        <span className={formFieldLegendClass}>RFC *</span>
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
        <span className={formFieldLegendClass}>Razón social *</span>
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
        <span className={formFieldLegendClass}>Régimen fiscal *</span>
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
        <span className={formFieldLegendClass}>Uso de CFDI *</span>
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
      <p className="sm:col-span-2 text-[10px] text-slate-400">* Campos obligatorios</p>
    </form>
  );

  if (embedded) return formBody;

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm md:col-span-2">
      <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest mb-4">
        Perfil del negocio y facturación
      </h2>
      {formBody}
    </section>
  );
}
