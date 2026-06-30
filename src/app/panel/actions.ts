"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-utils";
import { listaSocios } from "@/app/data/socios";
import { canLinkSocioAccount, getPlanLabel, isTuristaPlan } from "@/lib/membresia";
import { BUSINESS_CATEGORY_OPTIONS } from "@/lib/business-categories";
import { getStripe } from "@/lib/stripe";
import type { MembershipPlan } from "@/generated/prisma/client";
import { normalizeWebsiteUrl, parseWebsiteUrl } from "@/lib/url-utils";

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

const profileSchema = z.object({
  businessName: z.string().trim().max(120).optional(),
  website: optionalUrlField,
  googleBusinessUrl: optionalUrlField,
  category: z.string().trim().max(80).optional(),
  address: z.string().trim().max(300).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  rfc: z.string().trim().min(12, "RFC obligatorio (12–13 caracteres).").max(13),
  razonSocial: z.string().trim().min(3, "Razón social obligatoria.").max(200),
  regimenFiscal: z.string().trim().min(3, "Régimen fiscal obligatorio.").max(120),
  usoCfdi: z.string().trim().min(3, "Uso de CFDI obligatorio.").max(80),
  billingStreet: z.string().trim().max(200).optional(),
  billingColonia: z.string().trim().max(120).optional(),
  billingCiudad: z.string().trim().max(120).optional(),
  billingEstado: z.string().trim().max(80).optional(),
  billingPais: z.string().trim().max(80).optional(),
  billingCodigoPostal: z.string().trim().min(4, "Código postal fiscal obligatorio.").max(10),
  billingAddressFull: z.string().trim().max(400).optional(),
});

const manualBusinessSchema = z.object({
  businessName: z.string().trim().min(2, "Ingresa el nombre del negocio.").max(120),
  address: z.string().trim().min(5, "Ingresa la dirección del negocio.").max(300),
  category: z.enum(BUSINESS_CATEGORY_OPTIONS, { message: "Selecciona el giro del negocio." }),
  website: z.string().trim().max(500).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  rfc: z.string().trim().min(12, "RFC inválido.").max(13),
  razonSocial: z.string().trim().min(3, "Ingresa la razón social.").max(200),
  regimenFiscal: z.string().trim().min(3, "Selecciona el régimen fiscal.").max(120),
  usoCfdi: z.string().trim().min(3, "Selecciona el uso de CFDI.").max(80),
  billingCodigoPostal: z.string().trim().min(4, "Ingresa el C.P.").max(10),
});

export type LinkSocioResult =
  | { ok: true; socioName: string; plan: MembershipPlan; planLabel: string; pendingApproval: true }
  | { ok: false; error: string };

async function assertCanLink(userId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (!subscription || !canLinkSocioAccount(subscription.status)) {
    return {
      ok: false as const,
      error:
        "Solo puedes vincular tu negocio cuando tu pago esté verificado (tarjeta activa o transferencia confirmada).",
    };
  }
  return { ok: true as const, subscription };
}

async function upsertPendingProfile(
  userId: string,
  data: {
    businessName: string;
    website?: string | null;
    googleBusinessUrl?: string | null;
    isManualEntry: boolean;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    category?: string | null;
    rfc?: string | null;
    razonSocial?: string | null;
    regimenFiscal?: string | null;
    usoCfdi?: string | null;
    billingCodigoPostal?: string | null;
  }
) {
  await prisma.socioProfile.upsert({
    where: { userId },
    create: {
      userId,
      businessName: data.businessName,
      website: data.website ?? null,
      googleBusinessUrl: data.googleBusinessUrl ?? null,
      linkageStatus: "pending",
      isManualEntry: data.isManualEntry,
      address: data.address ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      category: data.category ?? null,
      rfc: data.rfc ?? null,
      razonSocial: data.razonSocial ?? null,
      regimenFiscal: data.regimenFiscal ?? null,
      usoCfdi: data.usoCfdi ?? null,
      billingCodigoPostal: data.billingCodigoPostal ?? null,
    },
    update: {
      businessName: data.businessName,
      website: data.website ?? null,
      googleBusinessUrl: data.googleBusinessUrl ?? null,
      linkageStatus: "pending",
      isManualEntry: data.isManualEntry,
      address: data.address ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      category: data.category ?? null,
      rfc: data.rfc ?? null,
      razonSocial: data.razonSocial ?? null,
      regimenFiscal: data.regimenFiscal ?? null,
      usoCfdi: data.usoCfdi ?? null,
      billingCodigoPostal: data.billingCodigoPostal ?? null,
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

    const linkCheck = await assertCanLink(session.id);
    if (!linkCheck.ok) return linkCheck;

    // Respeta el plan pagado; no degradar según categoría del catálogo.
    const paidPlan = linkCheck.subscription.plan;

    await prisma.user.update({
      where: { id: session.id },
      data: { socioId },
    });

    await upsertPendingProfile(session.id, {
      businessName: socio.name,
      website: socio.url || null,
      googleBusinessUrl: socio.direccion || null,
      isManualEntry: false,
      category: socio.categoria,
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

export async function registerManualBusiness(input: {
  businessName: string;
  address: string;
  category: string;
  website?: string;
  googleBusinessUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  usoCfdi: string;
  billingCodigoPostal: string;
}): Promise<LinkSocioResult> {
  try {
    const session = await requireSession();
    const parsed = manualBusinessSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const linkCheck = await assertCanLink(session.id);
    if (!linkCheck.ok) return linkCheck;

    const {
      businessName,
      address,
      category,
      website,
      latitude,
      longitude,
      rfc,
      razonSocial,
      regimenFiscal,
      usoCfdi,
      billingCodigoPostal,
    } = parsed.data;
    let websiteUrl: string | null = null;
    if (website?.trim()) {
      const parsedUrl = parseWebsiteUrl(website);
      if (!parsedUrl) {
        return { ok: false, error: "Ingresa una URL de sitio web válida o déjala vacía." };
      }
      websiteUrl = parsedUrl;
    }

    await upsertPendingProfile(session.id, {
      businessName,
      address,
      category,
      website: websiteUrl,
      googleBusinessUrl: input.googleBusinessUrl?.trim() || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      isManualEntry: true,
      rfc,
      razonSocial,
      regimenFiscal,
      usoCfdi,
      billingCodigoPostal,
    });

    revalidatePath("/panel");
    revalidatePath("/admin");

    const paidPlan = linkCheck.subscription.plan;
    return {
      ok: true,
      socioName: businessName,
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
      error: "No encontramos una suscripción activa para cancelar. Contacta a hola@barriandopuebla.com",
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo cancelar la membresía. Intenta de nuevo." };
  }
}

export async function updateSocioProfile(input: {
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
}): Promise<UpdateProfileResult> {
  try {
    const session = await requireSession();
    const subscription = await prisma.subscription.findUnique({ where: { userId: session.id } });
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
      const labels = parsed.error.issues.map((i) => i.message).join(" · ");
      return { ok: false, error: `Faltan datos obligatorios: ${labels}` };
    }

    if (subscription?.plan !== "VECINO" && !parsed.data.businessName?.trim()) {
      return { ok: false, error: "Ingresa el nombre del negocio." };
    }

    const profile = await prisma.socioProfile.findUnique({ where: { userId: session.id } });
    if (!profile && !session.socioId) {
      return { ok: false, error: "Vincula tu negocio antes de editar el perfil." };
    }

    const data = parsed.data;
    const businessName =
      data.businessName?.trim() || profile?.businessName?.trim() || null;

    await prisma.socioProfile.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        ...data,
        businessName,
        linkageStatus: profile?.linkageStatus ?? "pending",
      },
      update: {
        ...data,
        businessName,
      },
    });

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
        manualPaymentNote: note?.trim() || null,
        currentPeriodEnd: null,
      },
      update: {
        plan,
        status: "manual_pending",
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
