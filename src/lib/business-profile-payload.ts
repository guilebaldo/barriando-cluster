import type { SocioProfileFormInitial } from "@/app/panel/business-profile-types";
import {
  applyBillingSameFlags,
  composeBillingAddress,
  composeBusinessAddress,
} from "@/lib/business-address";

/** Campos Prisma de SocioProfile que vienen del formulario de registro/negocio. */
export function toSocioProfileDbFields(data: SocioProfileFormInitial) {
  const normalized = applyBillingSameFlags(data);
  const address = normalized.address?.trim() || composeBusinessAddress(normalized);
  const billingAddressFull =
    normalized.billingAddressFull?.trim() || composeBillingAddress(normalized);
  const birth = normalized.contactBirthDate?.trim()
    ? new Date(normalized.contactBirthDate)
    : null;

  return {
    businessName: normalized.businessName.trim() || null,
    website: normalized.website.trim() || null,
    googleBusinessUrl: normalized.googleBusinessUrl.trim() || null,
    category: normalized.category.trim() || null,
    address: address || null,
    street: normalized.street.trim() || null,
    streetNumber: normalized.streetNumber.trim() || null,
    colonia: normalized.colonia.trim() || null,
    codigoPostal: normalized.codigoPostal.trim() || null,
    municipio: normalized.municipio.trim() || null,
    estado: normalized.estado.trim() || null,
    pais: normalized.pais.trim() || null,
    phone: normalized.phone.trim() || null,
    latitude: normalized.latitude ?? null,
    longitude: normalized.longitude ?? null,
    contactFirstName: normalized.contactFirstName.trim() || null,
    contactLastNamePaternal: normalized.contactLastNamePaternal.trim() || null,
    contactLastNameMaternal: normalized.contactLastNameMaternal.trim() || null,
    contactRole: normalized.contactRole.trim() || null,
    contactBirthDate: birth && !Number.isNaN(birth.getTime()) ? birth : null,
    contactWhatsapp: normalized.contactWhatsapp.trim() || null,
    contactEmail: normalized.contactEmail.trim() || null,
    rfc: normalized.rfc.trim() || null,
    razonSocial: normalized.razonSocial.trim() || null,
    personaTipo: normalized.personaTipo.trim() || null,
    regimenFiscal: normalized.regimenFiscal.trim() || null,
    usoCfdi: normalized.usoCfdi.trim() || null,
    billingStreet: normalized.billingStreet.trim() || null,
    billingStreetNumber: normalized.billingStreetNumber.trim() || null,
    billingColonia: normalized.billingColonia.trim() || null,
    billingCiudad: (normalized.billingMunicipio || normalized.billingCiudad).trim() || null,
    billingMunicipio: normalized.billingMunicipio.trim() || null,
    billingEstado: normalized.billingEstado.trim() || null,
    billingPais: normalized.billingPais.trim() || null,
    billingCodigoPostal: normalized.billingCodigoPostal.trim() || null,
    billingAddressFull: billingAddressFull || null,
    billingSameWhatsapp: Boolean(normalized.billingSameWhatsapp),
    billingSameEmail: Boolean(normalized.billingSameEmail),
    billingSameAddress: Boolean(normalized.billingSameAddress),
    billingWhatsapp: normalized.billingWhatsapp.trim() || null,
    billingEmail: normalized.billingEmail.trim() || null,
    privacyAcceptedAt: normalized.privacyAccepted ? new Date() : undefined,
  };
}
