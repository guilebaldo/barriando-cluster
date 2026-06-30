"use client";

import { useCallback, useMemo, useState } from "react";
import { Building2, Save } from "lucide-react";
import { updateSocioProfile } from "./actions";
import BillingPlacesAutocomplete, { type ParsedBillingAddress } from "./BillingPlacesAutocomplete";

const REGIMEN_OPTIONS = [
  "601 - General de Ley Personas Morales",
  "603 - Personas Morales con Fines no Lucrativos",
  "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios",
  "606 - Arrendamiento",
  "612 - Personas Físicas con Actividades Empresariales y Profesionales",
  "621 - Incorporación Fiscal",
  "625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
  "626 - Régimen Simplificado de Confianza",
];

const CFDI_OPTIONS = [
  "G03 - Gastos en general",
  "S01 - Sin efectos fiscales",
  "CP01 - Pagos",
  "D10 - Pagos por servicios educativos",
];

export interface SocioProfileFormInitial {
  businessName: string;
  website: string;
  googleBusinessUrl: string;
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
  disabled?: boolean;
  hideBusinessName?: boolean;
}

export default function SocioProfileForm({ initial, disabled, hideBusinessName }: SocioProfileFormProps) {
  const [form, setForm] = useState(initial);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial]
  );

  const set = (key: keyof SocioProfileFormInitial, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onAddressSelected = useCallback((parsed: ParsedBillingAddress) => {
    setForm((prev) => ({ ...prev, ...parsed }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty) return;
    setMsg("");
    setLoading(true);
    const result = await updateSocioProfile(form);
    setLoading(false);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
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
            type="url"
            required
            disabled={disabled || loading}
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://"
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Google My Business
          </span>
          <input
            type="url"
            required
            disabled={disabled || loading}
            value={form.googleBusinessUrl}
            onChange={(e) => set("googleBusinessUrl", e.target.value)}
            placeholder="https://maps.google.com/..."
            className={`${inputClass} mt-1`}
          />
        </label>

        <div className="sm:col-span-2 pt-2 border-t border-slate-100">
          <p className="text-[10px] font-bold text-[#27366D] uppercase tracking-widest mb-3">
            Datos de facturación
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

        <label className="block sm:col-span-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Buscar dirección fiscal (Google Places)
          </span>
          <BillingPlacesAutocomplete
            disabled={disabled || loading}
            onAddressSelected={onAddressSelected}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Dirección completa
          </span>
          <input
            type="text"
            required
            disabled={disabled || loading}
            value={form.billingAddressFull}
            onChange={(e) => set("billingAddressFull", e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Calle y número
          </span>
          <input
            type="text"
            required
            disabled={disabled || loading}
            value={form.billingStreet}
            onChange={(e) => set("billingStreet", e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Colonia</span>
          <input
            type="text"
            required
            disabled={disabled || loading}
            value={form.billingColonia}
            onChange={(e) => set("billingColonia", e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Ciudad / Municipio
          </span>
          <input
            type="text"
            required
            disabled={disabled || loading}
            value={form.billingCiudad}
            onChange={(e) => set("billingCiudad", e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado</span>
          <input
            type="text"
            required
            disabled={disabled || loading}
            value={form.billingEstado}
            onChange={(e) => set("billingEstado", e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">País</span>
          <input
            type="text"
            required
            disabled={disabled || loading}
            value={form.billingPais}
            onChange={(e) => set("billingPais", e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">C.P.</span>
          <input
            type="text"
            required
            disabled={disabled || loading}
            value={form.billingCodigoPostal}
            onChange={(e) => set("billingCodigoPostal", e.target.value)}
            className={`${inputClass} mt-1`}
            maxLength={10}
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
