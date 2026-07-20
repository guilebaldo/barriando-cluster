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
