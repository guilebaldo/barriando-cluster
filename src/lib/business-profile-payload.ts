import type { SocioProfileFormInitial } from "@/app/panel/business-profile-types";
import { composeBillingAddress, composeBusinessAddress } from "@/lib/business-address";

/** Campos Prisma de SocioProfile que vienen del formulario de registro/negocio. */
export function toSocioProfileDbFields(data: SocioProfileFormInitial) {
  const address = data.address?.trim() || composeBusinessAddress(data);
  const billingAddressFull =
    data.billingAddressFull?.trim() || composeBillingAddress(data);
  const birth = data.contactBirthDate?.trim()
    ? new Date(data.contactBirthDate)
    : null;

  return {
    businessName: data.businessName.trim() || null,
    website: data.website.trim() || null,
    googleBusinessUrl: data.googleBusinessUrl.trim() || null,
    category: data.category.trim() || null,
    address: address || null,
    street: data.street.trim() || null,
    streetNumber: data.streetNumber.trim() || null,
    colonia: data.colonia.trim() || null,
    codigoPostal: data.codigoPostal.trim() || null,
    municipio: data.municipio.trim() || null,
    estado: data.estado.trim() || null,
    pais: data.pais.trim() || null,
    phone: data.phone.trim() || null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    contactFirstName: data.contactFirstName.trim() || null,
    contactLastNamePaternal: data.contactLastNamePaternal.trim() || null,
    contactLastNameMaternal: data.contactLastNameMaternal.trim() || null,
    contactRole: data.contactRole.trim() || null,
    contactBirthDate: birth && !Number.isNaN(birth.getTime()) ? birth : null,
    contactWhatsapp: data.contactWhatsapp.trim() || null,
    contactEmail: data.contactEmail.trim() || null,
    rfc: data.rfc.trim() || null,
    razonSocial: data.razonSocial.trim() || null,
    personaTipo: data.personaTipo.trim() || null,
    regimenFiscal: data.regimenFiscal.trim() || null,
    usoCfdi: data.usoCfdi.trim() || null,
    billingStreet: data.billingStreet.trim() || null,
    billingStreetNumber: data.billingStreetNumber.trim() || null,
    billingColonia: data.billingColonia.trim() || null,
    billingCiudad: (data.billingMunicipio || data.billingCiudad).trim() || null,
    billingMunicipio: data.billingMunicipio.trim() || null,
    billingEstado: data.billingEstado.trim() || null,
    billingPais: data.billingPais.trim() || null,
    billingCodigoPostal: data.billingCodigoPostal.trim() || null,
    billingAddressFull: billingAddressFull || null,
    billingSameWhatsapp: Boolean(data.billingSameWhatsapp),
    billingSameEmail: Boolean(data.billingSameEmail),
    billingWhatsapp: data.billingSameWhatsapp
      ? data.contactWhatsapp.trim() || null
      : data.billingWhatsapp.trim() || null,
    billingEmail: data.billingSameEmail
      ? data.contactEmail.trim() || null
      : data.billingEmail.trim() || null,
    privacyAcceptedAt: data.privacyAccepted ? new Date() : undefined,
  };
}
