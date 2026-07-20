"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-utils";
import { listaSocios } from "@/app/data/socios";
import { canRegisterBusinessProfile, getPlanLabel, isBusinessPlan, isPaidMember, isTuristaPlan } from "@/lib/membresia";
import { isLinkageApproved } from "@/lib/linkage";
import {
  buildBenefitVerifyUrl,
  signBenefitCredentialToken,
} from "@/lib/benefit-credential";
import { BUSINESS_CATEGORY_OPTIONS } from "@/lib/business-categories";
import { getStripe } from "@/lib/stripe";
import type { MembershipPlan } from "@/generated/prisma/client";
import { normalizeWebsiteUrl, parseWebsiteUrl } from "@/lib/url-utils";
import type { SocioProfileFormInitial } from "./business-profile-types";
import { toSocioProfileDbFields } from "@/lib/business-profile-payload";
import { emptyBusinessProfile } from "@/lib/business-address";
import { CONTACT_ROLE_OPTIONS, PERSONA_TIPO_OPTIONS } from "@/lib/fiscal-options";

const optionalUrlField = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => {
    if (!v?.trim()) return "";
    return normalizeWebsiteUrl(v.trim());
  })
  .refine((v) => !v || parseWebsiteUrl(v) !== null, "URL inválida.");

const contactRoleValues = CONTACT_ROLE_OPTIONS.map((o) => o.value) as [string, ...string[]];
const personaTipoValues = PERSONA_TIPO_OPTIONS.map((o) => o.value) as [string, ...string[]];

const businessProfileSchema = z.object({
  businessName: z.string().trim().min(2, "Ingresa el nombre comercial.").max(120),
  website: optionalUrlField,
  googleBusinessUrl: optionalUrlField,
  category: z.enum(BUSINESS_CATEGORY_OPTIONS, { message: "Selecciona el giro." }),
  address: z.string().trim().max(400).optional(),
  street: z.string().trim().min(1, "Calle obligatoria.").max(200),
  streetNumber: z.string().trim().min(1, "Número obligatorio.").max(40),
  colonia: z.string().trim().min(1, "Colonia obligatoria.").max(120),
  codigoPostal: z.string().trim().min(4, "C.P. obligatorio.").max(10),
  municipio: z.string().trim().min(1, "Municipio obligatorio.").max(120),
  estado: z.string().trim().min(1, "Estado obligatorio.").max(80),
  pais: z.string().trim().min(1, "País obligatorio.").max(80),
  phone: z.string().trim().min(7, "Teléfono del negocio obligatorio.").max(30),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  contactFirstName: z.string().trim().min(1, "Nombre obligatorio.").max(80),
  contactLastNamePaternal: z.string().trim().min(1, "Apellido paterno obligatorio.").max(80),
  contactLastNameMaternal: z.string().trim().max(80).optional(),
  contactRole: z.enum(contactRoleValues, { message: "Selecciona el rol." }),
  contactBirthDate: z.string().trim().min(8, "Fecha de nacimiento obligatoria."),
  contactWhatsapp: z.string().trim().min(7, "WhatsApp obligatorio.").max(30),
  contactEmail: z.string().trim().email("Email de contacto inválido.").max(160),
  rfc: z.string().trim().min(12, "RFC inválido.").max(13),
  razonSocial: z.string().trim().min(3, "Razón social obligatoria.").max(200),
  personaTipo: z.enum(personaTipoValues, { message: "Selecciona tipo de persona." }),
  regimenFiscal: z.string().trim().min(3, "Régimen fiscal obligatorio.").max(160),
  usoCfdi: z.string().trim().min(3, "Uso de CFDI obligatorio.").max(160),
  billingStreet: z.string().trim().min(1, "Calle fiscal obligatoria.").max(200),
  billingStreetNumber: z.string().trim().min(1, "Número fiscal obligatorio.").max(40),
  billingColonia: z.string().trim().min(1, "Colonia fiscal obligatoria.").max(120),
  billingCiudad: z.string().trim().max(120).optional(),
  billingMunicipio: z.string().trim().min(1, "Municipio fiscal obligatorio.").max(120),
  billingEstado: z.string().trim().min(1, "Estado fiscal obligatorio.").max(80),
  billingPais: z.string().trim().min(1, "País fiscal obligatorio.").max(80),
  billingCodigoPostal: z.string().trim().min(4, "C.P. fiscal obligatorio.").max(10),
  billingAddressFull: z.string().trim().max(400).optional(),
  billingWhatsapp: z.string().trim().max(30).optional(),
  billingEmail: z.string().trim().max(160).optional(),
  billingSameWhatsapp: z.boolean(),
  billingSameEmail: z.boolean(),
  privacyAccepted: z.boolean().optional(),
});

const profileSchema = businessProfileSchema.partial({
  businessName: true,
  category: true,
  street: true,
  streetNumber: true,
  colonia: true,
  codigoPostal: true,
  municipio: true,
  estado: true,
  pais: true,
  phone: true,
  latitude: true,
  longitude: true,
  contactFirstName: true,
  contactLastNamePaternal: true,
  contactRole: true,
  contactBirthDate: true,
  contactWhatsapp: true,
  contactEmail: true,
  rfc: true,
  razonSocial: true,
  personaTipo: true,
  regimenFiscal: true,
  usoCfdi: true,
  billingStreet: true,
  billingStreetNumber: true,
  billingColonia: true,
  billingMunicipio: true,
  billingEstado: true,
  billingPais: true,
  billingCodigoPostal: true,
}).extend({
  businessName: z.string().trim().max(120).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export type LinkSocioResult =
  | { ok: true; socioName: string; plan: MembershipPlan; planLabel: string; pendingApproval: true }
  | { ok: false; error: string };

async function assertCanRegisterBusiness(userId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (!subscription || !canRegisterBusinessProfile(subscription.plan, subscription.status)) {
    return {
      ok: false as const,
      error:
        "Selecciona un plan de negocio (Pequeña, Mediana o Gran Empresa) para registrar tu establecimiento. Puedes completar los datos aunque el pago aún esté pendiente.",
    };
  }
  return { ok: true as const, subscription };
}

async function upsertPendingProfile(
  userId: string,
  data: ReturnType<typeof toSocioProfileDbFields> & { isManualEntry: boolean }
) {
  const { privacyAcceptedAt, isManualEntry, ...rest } = data;
  await prisma.socioProfile.upsert({
    where: { userId },
    create: {
      userId,
      linkageStatus: "pending",
      isManualEntry,
      ...rest,
      ...(privacyAcceptedAt ? { privacyAcceptedAt } : {}),
    },
    update: {
      linkageStatus: "pending",
      isManualEntry,
      ...rest,
      ...(privacyAcceptedAt ? { privacyAcceptedAt } : {}),
    },
  });
}

export async function linkSocioAccount(socioId: number): Promise<LinkSocioResult> {
  try {
    const session = await requireSession();

    const socio = listaSocios.find((s) => s.id === socioId);
    if (!socio) {
      return { ok: false, error: "El negocio seleccionado no existe en el catálogo." };
    }

    const taken = await prisma.user.findFirst({
      where: { socioId, NOT: { id: session.id } },
    });
    if (taken) {
      return { ok: false, error: "Este negocio ya está vinculado a otra cuenta." };
    }

    const linkCheck = await assertCanRegisterBusiness(session.id);
    if (!linkCheck.ok) return linkCheck;

    const paidPlan = linkCheck.subscription.plan;

    await prisma.user.update({
      where: { id: session.id },
      data: { socioId },
    });

    await prisma.socioProfile.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        businessName: socio.name,
        website: socio.url || null,
        googleBusinessUrl: socio.direccion || null,
        category: socio.categoria,
        linkageStatus: "pending",
        isManualEntry: false,
        contactEmail: session.email ?? null,
      },
      update: {
        businessName: socio.name,
        website: socio.url || null,
        googleBusinessUrl: socio.direccion || null,
        category: socio.categoria,
        linkageStatus: "pending",
        isManualEntry: false,
      },
    });

    revalidatePath("/panel");
    revalidatePath("/admin");

    return {
      ok: true,
      socioName: socio.name,
      plan: paidPlan,
      planLabel: getPlanLabel(paidPlan),
      pendingApproval: true,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo vincular el negocio. Intenta de nuevo." };
  }
}

export async function registerManualBusiness(
  input: SocioProfileFormInitial
): Promise<LinkSocioResult> {
  try {
    const session = await requireSession();
    const parsed = businessProfileSchema.safeParse({
      ...input,
      contactLastNameMaternal: input.contactLastNameMaternal ?? "",
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }
    if (!input.privacyAccepted) {
      return { ok: false, error: "Debes aceptar el aviso de privacidad." };
    }
    if (!input.billingSameWhatsapp && !input.billingWhatsapp?.trim()) {
      return { ok: false, error: "Indica el WhatsApp fiscal o marca «usar el mismo»." };
    }
    if (!input.billingSameEmail && !input.billingEmail?.trim()) {
      return { ok: false, error: "Indica el email fiscal o marca «usar el mismo»." };
    }

    const linkCheck = await assertCanRegisterBusiness(session.id);
    if (!linkCheck.ok) return linkCheck;

    const dbFields = toSocioProfileDbFields({
      ...parsed.data,
      contactLastNameMaternal: parsed.data.contactLastNameMaternal ?? "",
      googleBusinessUrl: parsed.data.googleBusinessUrl ?? "",
      address: parsed.data.address ?? "",
      billingCiudad: parsed.data.billingCiudad ?? "",
      billingAddressFull: parsed.data.billingAddressFull ?? "",
      billingWhatsapp: parsed.data.billingWhatsapp ?? "",
      billingEmail: parsed.data.billingEmail ?? "",
      privacyAccepted: true,
    } as SocioProfileFormInitial);

    await upsertPendingProfile(session.id, {
      ...dbFields,
      isManualEntry: true,
    });

    revalidatePath("/panel");
    revalidatePath("/admin");

    const paidPlan = linkCheck.subscription.plan;
    return {
      ok: true,
      socioName: parsed.data.businessName,
      plan: paidPlan,
      planLabel: getPlanLabel(paidPlan),
      pendingApproval: true,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo registrar el negocio. Intenta de nuevo." };
  }
}

export type ReportPaymentResult = { ok: true } | { ok: false; error: string };

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

export type CancelMembershipResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function cancelMembership(): Promise<CancelMembershipResult> {
  try {
    const session = await requireSession();
    const subscription = await prisma.subscription.findUnique({ where: { userId: session.id } });
    if (!subscription || isTuristaPlan(subscription.plan)) {
      return { ok: false, error: "No tienes una membresía de pago activa." };
    }

    const stripe = getStripe();
    if (subscription.stripeSubscriptionId && stripe) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      revalidatePath("/panel");
      return {
        ok: true,
        message:
          "Tu membresía se cancelará al final del periodo facturado. Seguirás con acceso hasta esa fecha.",
      };
    }

    if (subscription.status === "manual_active") {
      await prisma.subscription.update({
        where: { userId: session.id },
        data: { status: "inactive" },
      });
      revalidatePath("/panel");
      return { ok: true, message: "Membresía manual cancelada." };
    }

    return {
      ok: false,
      error: "No encontramos una suscripción activa para cancelar. Contacta a facturacionbarriandopuebla@gmail.com",
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo cancelar la membresía. Intenta de nuevo." };
  }
}

export async function updateSocioProfile(
  input: SocioProfileFormInitial
): Promise<UpdateProfileResult> {
  try {
    const session = await requireSession();
    const subscription = await prisma.subscription.findUnique({ where: { userId: session.id } });
    const parsed = profileSchema.safeParse({
      ...input,
      contactLastNameMaternal: input.contactLastNameMaternal ?? "",
    });
    if (!parsed.success) {
      const labels = parsed.error.issues.map((i) => i.message).join(" · ");
      return { ok: false, error: `Faltan datos obligatorios: ${labels}` };
    }

    if (subscription?.plan !== "VECINO" && !parsed.data.businessName?.trim()) {
      return { ok: false, error: "Ingresa el nombre del negocio." };
    }

    if (!input.billingSameWhatsapp && !input.billingWhatsapp?.trim()) {
      return { ok: false, error: "Indica el WhatsApp fiscal o marca «usar el mismo»." };
    }
    if (!input.billingSameEmail && !input.billingEmail?.trim()) {
      return { ok: false, error: "Indica el email fiscal o marca «usar el mismo»." };
    }

    const profile = await prisma.socioProfile.findUnique({ where: { userId: session.id } });
    if (!profile && !session.socioId) {
      return { ok: false, error: "Vincula tu negocio antes de editar el perfil." };
    }

    const dbFields = toSocioProfileDbFields({
      ...emptyBusinessProfile(session.email ?? ""),
      ...input,
      ...parsed.data,
      contactLastNameMaternal: parsed.data.contactLastNameMaternal ?? "",
      googleBusinessUrl: parsed.data.googleBusinessUrl ?? "",
      address: parsed.data.address ?? "",
      billingCiudad: parsed.data.billingCiudad ?? "",
      billingAddressFull: parsed.data.billingAddressFull ?? "",
      billingWhatsapp: parsed.data.billingWhatsapp ?? "",
      billingEmail: parsed.data.billingEmail ?? "",
      privacyAccepted: input.privacyAccepted || Boolean(profile?.privacyAcceptedAt),
    } as SocioProfileFormInitial);

    const { privacyAcceptedAt, ...rest } = dbFields;
    const businessName =
      rest.businessName?.trim() || profile?.businessName?.trim() || null;

    await prisma.socioProfile.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        ...rest,
        businessName,
        linkageStatus: profile?.linkageStatus ?? "pending",
        ...(privacyAcceptedAt ? { privacyAcceptedAt } : {}),
      },
      update: {
        ...rest,
        businessName,
        ...(privacyAcceptedAt ? { privacyAcceptedAt } : {}),
      },
    });

    if (session.socioId != null) {
      await prisma.catalogMembership.updateMany({
        where: { socioId: session.socioId },
        data: {
          businessName,
          category: rest.category?.trim() || null,
        },
      });
    }

    revalidatePath("/panel");
    revalidatePath("/admin");
    revalidatePath("/socios");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo guardar el perfil. Intenta de nuevo." };
  }
}

export async function reportManualPayment(
  plan: MembershipPlan,
  note?: string
): Promise<ReportPaymentResult> {
  try {
    const session = await requireSession();

    if (plan === "TURISTA") {
      return { ok: false, error: "Selecciona un plan de pago." };
    }

    await prisma.subscription.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        plan,
        status: "manual_pending",
        paymentMethod: "transfer",
        manualPaymentNote: note?.trim() || null,
        currentPeriodEnd: null,
      },
      update: {
        plan,
        status: "manual_pending",
        paymentMethod: "transfer",
        manualPaymentNote: note?.trim() || null,
        currentPeriodEnd: null,
      },
    });

    revalidatePath("/panel");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo registrar el pago. Intenta de nuevo." };
  }
}

export type UpdateBenefitResult = { ok: true } | { ok: false; error: string };

export type BenefitCredentialResult =
  | { ok: true; verifyUrl: string; expiresInSeconds: number }
  | { ok: false; error: string };

const benefitSchema = z.object({
  offersBenefit: z.boolean(),
  benefitTitle: z.string().trim().max(120),
  benefitDescription: z.string().trim().max(600),
  benefitHowToRedeem: z.string().trim().max(600),
  benefitRedeemViaQr: z.boolean(),
  benefitValidFrom: z.string().trim().optional(),
  benefitValidUntil: z.string().trim().optional(),
});

function parseOptionalDate(value?: string): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function updateSocioBenefit(input: {
  offersBenefit: boolean;
  benefitTitle: string;
  benefitDescription: string;
  benefitHowToRedeem: string;
  benefitRedeemViaQr: boolean;
  benefitValidFrom?: string;
  benefitValidUntil?: string;
}): Promise<UpdateBenefitResult> {
  try {
    const session = await requireSession();
    const subscription = await prisma.subscription.findUnique({ where: { userId: session.id } });
    if (!subscription || !isBusinessPlan(subscription.plan) || !isPaidMember(subscription.plan, subscription.status)) {
      return { ok: false, error: "Solo negocios con membresía activa pueden publicar beneficios." };
    }

    const profile = await prisma.socioProfile.findUnique({ where: { userId: session.id } });
    if (!profile || !isLinkageApproved(profile.linkageStatus)) {
      return { ok: false, error: "Tu negocio debe estar vinculado y aprobado para publicar beneficios." };
    }

    const parsed = benefitSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const data = parsed.data;
    if (data.offersBenefit) {
      if (!data.benefitTitle.trim()) return { ok: false, error: "Indica el título del beneficio." };
      if (!data.benefitDescription.trim()) return { ok: false, error: "Describe qué ofrece el beneficio." };
      if (!data.benefitRedeemViaQr && !data.benefitHowToRedeem.trim()) {
        return { ok: false, error: "Explica cómo se hace válido el beneficio." };
      }
    }

    const benefitPayload = {
      offersBenefit: data.offersBenefit,
      benefitTitle: data.offersBenefit ? data.benefitTitle.trim() : null,
      benefitDescription: data.offersBenefit ? data.benefitDescription.trim() : null,
      benefitRedeemViaQr: data.offersBenefit ? data.benefitRedeemViaQr : false,
      benefitHowToRedeem: data.offersBenefit
        ? data.benefitRedeemViaQr
          ? data.benefitHowToRedeem.trim() ||
            "Muestra este QR al negocio para validar tu membresía."
          : data.benefitHowToRedeem.trim()
        : null,
      benefitValidFrom: data.offersBenefit ? parseOptionalDate(data.benefitValidFrom) : null,
      benefitValidUntil: data.offersBenefit ? parseOptionalDate(data.benefitValidUntil) : null,
    };

    await prisma.socioProfile.update({
      where: { userId: session.id },
      data: benefitPayload,
    });

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { socioId: true },
    });
    if (user?.socioId != null) {
      await prisma.catalogMembership.upsert({
        where: { socioId: user.socioId },
        create: {
          socioId: user.socioId,
          plan: subscription.plan,
          status: "active",
          businessName: profile.businessName,
          paymentMethod: subscription.paymentMethod,
          ...benefitPayload,
        },
        update: benefitPayload,
      });
    }

    revalidatePath("/panel");
    revalidatePath("/socios");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo guardar el beneficio. Intenta de nuevo." };
  }
}

export async function createBenefitCredential(): Promise<BenefitCredentialResult> {
  try {
    const session = await requireSession();
    const subscription = await prisma.subscription.findUnique({ where: { userId: session.id } });
    if (!subscription || !isPaidMember(subscription.plan, subscription.status)) {
      return {
        ok: false,
        error: "Necesitas una membresía de pago activa para usar beneficios.",
      };
    }

    const token = await signBenefitCredentialToken(session.id);
    return {
      ok: true,
      verifyUrl: buildBenefitVerifyUrl(token),
      expiresInSeconds: 15 * 60,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo generar la credencial. Intenta de nuevo." };
  }
}
