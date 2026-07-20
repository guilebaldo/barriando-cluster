"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import type { SocioProfileFormInitial } from "./business-profile-types";
import { BUSINESS_CATEGORY_OPTIONS, categorySelectOptions } from "@/lib/business-categories";
import {
  CFDI_OPTIONS,
  CONTACT_ROLE_OPTIONS,
  PERSONA_TIPO_OPTIONS,
  REGIMEN_OPTIONS,
} from "@/lib/fiscal-options";
import {
  formFieldDateClass,
  formFieldInputClass,
  formFieldLabelClass,
  formFieldLegendClass,
  formFieldSelectClass,
} from "@/lib/form-field-styles";

const LeafletLocationPicker = dynamic(() => import("./LeafletLocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-56 rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />
  ),
});

type Props = {
  form: SocioProfileFormInitial;
  set: <K extends keyof SocioProfileFormInitial>(
    key: K,
    value: SocioProfileFormInitial[K]
  ) => void;
  disabled?: boolean;
  requireFiscal?: boolean;
  requirePrivacy?: boolean;
  hideBusinessName?: boolean;
};

export default function BusinessProfileFields({
  form,
  set,
  disabled = false,
  requireFiscal = true,
  requirePrivacy = false,
  hideBusinessName = false,
}: Props) {
  const categoryOptions = useMemo(
    () => categorySelectOptions(form.category),
    [form.category]
  );

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#27366D]">
          Datos generales de la empresa
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={`${formFieldLabelClass}${hideBusinessName ? " sm:col-span-2" : ""}`}>
            <span className={formFieldLegendClass}>Giro / categoría *</span>
            <select
              required
              disabled={disabled}
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={`${formFieldSelectClass} mt-1`}
            >
              <option value="">Selecciona…</option>
              {(categoryOptions.length ? categoryOptions : BUSINESS_CATEGORY_OPTIONS).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          {!hideBusinessName ? (
            <label className={formFieldLabelClass}>
              <span className={formFieldLegendClass}>Nombre comercial *</span>
              <input
                required
                disabled={disabled}
                value={form.businessName}
                onChange={(e) => set("businessName", e.target.value)}
                className={`${formFieldInputClass} mt-1`}
                autoComplete="organization"
              />
            </label>
          ) : null}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Calle *</span>
            <input
              required
              disabled={disabled}
              value={form.street}
              onChange={(e) => set("street", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Número *</span>
            <input
              required
              disabled={disabled}
              value={form.streetNumber}
              onChange={(e) => set("streetNumber", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Colonia *</span>
            <input
              required
              disabled={disabled}
              value={form.colonia}
              onChange={(e) => set("colonia", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>C.P. *</span>
            <input
              required
              disabled={disabled}
              value={form.codigoPostal}
              onChange={(e) => set("codigoPostal", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
              inputMode="numeric"
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Municipio *</span>
            <input
              required
              disabled={disabled}
              value={form.municipio}
              onChange={(e) => set("municipio", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Estado *</span>
            <input
              required
              disabled={disabled}
              value={form.estado}
              onChange={(e) => set("estado", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
            />
          </label>
          <label className={`${formFieldLabelClass} sm:col-span-2`}>
            <span className={formFieldLegendClass}>País *</span>
            <input
              required
              disabled={disabled}
              value={form.pais}
              onChange={(e) => set("pais", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
            />
          </label>
        </div>

        <div>
          <p className={`${formFieldLegendClass} mb-2`}>Ubicación en el mapa *</p>
          <LeafletLocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            disabled={disabled}
            onChange={(lat, lng) => {
              set("latitude", lat);
              set("longitude", lng);
            }}
          />
        </div>

        <label className={formFieldLabelClass}>
          <span className={formFieldLegendClass}>Link de Google Maps</span>
          <input
            disabled={disabled}
            value={form.googleBusinessUrl}
            onChange={(e) => set("googleBusinessUrl", e.target.value)}
            className={`${formFieldInputClass} mt-1`}
            placeholder="https://maps.app.goo.gl/… o https://maps.google.com/…"
            autoComplete="url"
            inputMode="url"
          />
          <span className="mt-1 block text-[11px] text-slate-500 font-light leading-relaxed">
            Pega el enlace de tu ficha o ubicación en Google Maps (opcional, complementa el pin).
          </span>
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Teléfono del negocio *</span>
            <input
              required
              disabled={disabled}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
              inputMode="tel"
              autoComplete="tel"
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Sitio web</span>
            <input
              disabled={disabled}
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
              placeholder="https://"
              autoComplete="url"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#27366D]">
          Datos de contacto
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Nombre *</span>
            <input
              required
              disabled={disabled}
              value={form.contactFirstName}
              onChange={(e) => set("contactFirstName", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
              autoComplete="given-name"
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Apellido paterno *</span>
            <input
              required
              disabled={disabled}
              value={form.contactLastNamePaternal}
              onChange={(e) => set("contactLastNamePaternal", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
              autoComplete="family-name"
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Apellido materno</span>
            <input
              disabled={disabled}
              value={form.contactLastNameMaternal}
              onChange={(e) => set("contactLastNameMaternal", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Rol en el negocio *</span>
            <select
              required
              disabled={disabled}
              value={form.contactRole}
              onChange={(e) => set("contactRole", e.target.value)}
              className={`${formFieldSelectClass} mt-1`}
            >
              <option value="">Selecciona…</option>
              {CONTACT_ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Fecha de nacimiento *</span>
            <input
              required
              type="date"
              disabled={disabled}
              value={form.contactBirthDate}
              onChange={(e) => set("contactBirthDate", e.target.value)}
              className={`${formFieldDateClass} mt-1`}
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>WhatsApp *</span>
            <input
              required
              disabled={disabled}
              value={form.contactWhatsapp}
              onChange={(e) => set("contactWhatsapp", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
              inputMode="tel"
            />
          </label>
          <label className={`${formFieldLabelClass} sm:col-span-2`}>
            <span className={formFieldLegendClass}>Email *</span>
            <input
              required
              type="email"
              disabled={disabled}
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
              autoComplete="email"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#27366D]">
          Datos para facturación
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={`${formFieldLabelClass} sm:col-span-2`}>
            <span className={formFieldLegendClass}>
              Razón social{requireFiscal ? " *" : ""}
            </span>
            <input
              required={requireFiscal}
              disabled={disabled}
              value={form.razonSocial}
              onChange={(e) => set("razonSocial", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>RFC{requireFiscal ? " *" : ""}</span>
            <input
              required={requireFiscal}
              disabled={disabled}
              value={form.rfc}
              onChange={(e) => set("rfc", e.target.value.toUpperCase())}
              className={`${formFieldInputClass} mt-1`}
              maxLength={13}
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>
              Tipo de persona{requireFiscal ? " *" : ""}
            </span>
            <select
              required={requireFiscal}
              disabled={disabled}
              value={form.personaTipo}
              onChange={(e) => set("personaTipo", e.target.value)}
              className={`${formFieldSelectClass} mt-1`}
            >
              <option value="">Selecciona…</option>
              {PERSONA_TIPO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Dirección fiscal
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Calle{requireFiscal ? " *" : ""}</span>
            <input
              required={requireFiscal}
              disabled={disabled}
              value={form.billingStreet}
              onChange={(e) => set("billingStreet", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Número{requireFiscal ? " *" : ""}</span>
            <input
              required={requireFiscal}
              disabled={disabled}
              value={form.billingStreetNumber}
              onChange={(e) => set("billingStreetNumber", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Colonia{requireFiscal ? " *" : ""}</span>
            <input
              required={requireFiscal}
              disabled={disabled}
              value={form.billingColonia}
              onChange={(e) => set("billingColonia", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>C.P.{requireFiscal ? " *" : ""}</span>
            <input
              required={requireFiscal}
              disabled={disabled}
              value={form.billingCodigoPostal}
              onChange={(e) => set("billingCodigoPostal", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
              inputMode="numeric"
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Municipio{requireFiscal ? " *" : ""}</span>
            <input
              required={requireFiscal}
              disabled={disabled}
              value={form.billingMunicipio}
              onChange={(e) => set("billingMunicipio", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
            />
          </label>
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Estado{requireFiscal ? " *" : ""}</span>
            <input
              required={requireFiscal}
              disabled={disabled}
              value={form.billingEstado}
              onChange={(e) => set("billingEstado", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
            />
          </label>
          <label className={`${formFieldLabelClass} sm:col-span-2`}>
            <span className={formFieldLegendClass}>País{requireFiscal ? " *" : ""}</span>
            <input
              required={requireFiscal}
              disabled={disabled}
              value={form.billingPais}
              onChange={(e) => set("billingPais", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
            />
          </label>
        </div>

        <div className="grid gap-3">
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Uso de CFDI{requireFiscal ? " *" : ""}</span>
            <select
              required={requireFiscal}
              disabled={disabled}
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
            <span className={formFieldLegendClass}>Régimen fiscal{requireFiscal ? " *" : ""}</span>
            <select
              required={requireFiscal}
              disabled={disabled}
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
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            disabled={disabled}
            checked={form.billingSameWhatsapp}
            onChange={(e) => {
              set("billingSameWhatsapp", e.target.checked);
              if (e.target.checked) set("billingWhatsapp", "");
            }}
            className="mt-1"
          />
          <span>Usar el mismo WhatsApp de contacto para efectos fiscales</span>
        </label>
        {!form.billingSameWhatsapp ? (
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>WhatsApp fiscal *</span>
            <input
              required
              disabled={disabled}
              value={form.billingWhatsapp}
              onChange={(e) => set("billingWhatsapp", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
              inputMode="tel"
            />
          </label>
        ) : null}

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            disabled={disabled}
            checked={form.billingSameEmail}
            onChange={(e) => {
              set("billingSameEmail", e.target.checked);
              if (e.target.checked) set("billingEmail", "");
            }}
            className="mt-1"
          />
          <span>Usar el mismo email de contacto para efectos fiscales</span>
        </label>
        {!form.billingSameEmail ? (
          <label className={formFieldLabelClass}>
            <span className={formFieldLegendClass}>Email fiscal *</span>
            <input
              required
              type="email"
              disabled={disabled}
              value={form.billingEmail}
              onChange={(e) => set("billingEmail", e.target.value)}
              className={`${formFieldInputClass} mt-1`}
            />
          </label>
        ) : null}
      </section>

      {requirePrivacy ? (
        <label className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
          <input
            type="checkbox"
            required
            disabled={disabled}
            checked={form.privacyAccepted}
            onChange={(e) => set("privacyAccepted", e.target.checked)}
            className="mt-1"
          />
          <span>
            Acepto el tratamiento de mis datos personales para el alta, actualización y operación
            de mi membresía en Barriando, conforme a la Ley Federal de Protección de Datos
            Personales en Posesión de los Particulares. Consulta el{" "}
            <Link href="/privacidad" className="text-[#27366D] font-semibold underline" target="_blank">
              aviso de privacidad
            </Link>
            .
          </span>
        </label>
      ) : null}
    </div>
  );
}
