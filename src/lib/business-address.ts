import type { SocioProfileFormInitial } from "@/app/panel/business-profile-types";

export type { SocioProfileFormInitial } from "@/app/panel/business-profile-types";

export function composeBusinessAddress(parts: {
  street?: string;
  streetNumber?: string;
  colonia?: string;
  codigoPostal?: string;
  municipio?: string;
  estado?: string;
  pais?: string;
}): string {
  return [
    [parts.street, parts.streetNumber].filter(Boolean).join(" "),
    parts.colonia,
    parts.codigoPostal ? `C.P. ${parts.codigoPostal}` : "",
    parts.municipio,
    parts.estado,
    parts.pais,
  ]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(", ");
}

export function composeBillingAddress(parts: {
  billingStreet?: string;
  billingStreetNumber?: string;
  billingColonia?: string;
  billingCodigoPostal?: string;
  billingMunicipio?: string;
  billingCiudad?: string;
  billingEstado?: string;
  billingPais?: string;
}): string {
  return [
    [parts.billingStreet, parts.billingStreetNumber].filter(Boolean).join(" "),
    parts.billingColonia,
    parts.billingCodigoPostal ? `C.P. ${parts.billingCodigoPostal}` : "",
    parts.billingMunicipio || parts.billingCiudad,
    parts.billingEstado,
    parts.billingPais,
  ]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(", ");
}

export function emptyBusinessProfile(email = ""): SocioProfileFormInitial {
  return {
    businessName: "",
    website: "",
    googleBusinessUrl: "",
    category: "",
    address: "",
    street: "",
    streetNumber: "",
    colonia: "",
    codigoPostal: "",
    municipio: "",
    estado: "",
    pais: "México",
    phone: "",
    latitude: null,
    longitude: null,
    contactFirstName: "",
    contactLastNamePaternal: "",
    contactLastNameMaternal: "",
    contactRole: "",
    contactBirthDate: "",
    contactWhatsapp: "",
    contactEmail: email,
    rfc: "",
    razonSocial: "",
    personaTipo: "",
    regimenFiscal: "",
    usoCfdi: "",
    billingStreet: "",
    billingStreetNumber: "",
    billingColonia: "",
    billingCiudad: "",
    billingMunicipio: "",
    billingEstado: "",
    billingPais: "México",
    billingCodigoPostal: "",
    billingAddressFull: "",
    billingWhatsapp: "",
    billingEmail: "",
    billingSameWhatsapp: true,
    billingSameEmail: true,
    privacyAccepted: false,
  };
}

/** Combina defaults + datos guardados para SocioProfileForm / admin drawer. */
export function toBusinessProfileFormInitial(
  partial?: Partial<SocioProfileFormInitial> | null,
  email = ""
): SocioProfileFormInitial {
  const base = emptyBusinessProfile(email);
  if (!partial) return base;
  return {
    ...base,
    ...partial,
    contactEmail: partial.contactEmail?.trim() || email || base.contactEmail,
    pais: partial.pais?.trim() || base.pais,
    billingPais: partial.billingPais?.trim() || base.billingPais,
    billingMunicipio:
      partial.billingMunicipio?.trim() ||
      partial.billingCiudad?.trim() ||
      base.billingMunicipio,
    privacyAccepted: Boolean(partial.privacyAccepted),
  };
}

/** Campos obligatorios del alta manual «Mi negocio no está listado». */
export function isManualRegistrationComplete(form: SocioProfileFormInitial): boolean {
  const filled = (v: string | null | undefined) => Boolean(v?.trim());
  if (!filled(form.category) || !filled(form.businessName)) return false;
  if (
    !filled(form.street) ||
    !filled(form.streetNumber) ||
    !filled(form.colonia) ||
    !filled(form.codigoPostal) ||
    !filled(form.municipio) ||
    !filled(form.estado) ||
    !filled(form.pais)
  ) {
    return false;
  }
  if (form.latitude == null || form.longitude == null) return false;
  if (!filled(form.phone)) return false;
  if (
    !filled(form.contactFirstName) ||
    !filled(form.contactLastNamePaternal) ||
    !filled(form.contactRole) ||
    !filled(form.contactBirthDate) ||
    !filled(form.contactWhatsapp) ||
    !filled(form.contactEmail)
  ) {
    return false;
  }
  if (
    !filled(form.rfc) ||
    !filled(form.razonSocial) ||
    !filled(form.personaTipo) ||
    !filled(form.regimenFiscal) ||
    !filled(form.usoCfdi)
  ) {
    return false;
  }
  if (
    !filled(form.billingStreet) ||
    !filled(form.billingStreetNumber) ||
    !filled(form.billingColonia) ||
    !(filled(form.billingMunicipio) || filled(form.billingCiudad)) ||
    !filled(form.billingEstado) ||
    !filled(form.billingPais) ||
    !filled(form.billingCodigoPostal)
  ) {
    return false;
  }
  if (!form.billingSameWhatsapp && !filled(form.billingWhatsapp)) return false;
  if (!form.billingSameEmail && !filled(form.billingEmail)) return false;
  if (!form.privacyAccepted) return false;
  return true;
}
