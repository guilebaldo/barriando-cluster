"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-utils";
import { listaSocios } from "@/app/data/socios";
import { canLinkSocioAccount, getPlanLabel, isTuristaPlan } from "@/lib/membresia";
import { getStripe } from "@/lib/stripe";
import type { MembershipPlan } from "@/generated/prisma/client";

const profileSchema = z.object({
  businessName: z.string().trim().min(2, "Ingresa el nombre del negocio.").max(120),
  website: z.string().trim().url("Ingresa una URL válida para el sitio web.").max(500),
  googleBusinessUrl: z
    .string()
    .trim()
    .url("Ingresa una URL válida de Google My Business.")
    .max(500),
  rfc: z.string().trim().min(12, "RFC inválido.").max(13),
  razonSocial: z.string().trim().min(3, "Ingresa la razón social.").max(200),
  regimenFiscal: z.string().trim().min(3, "Selecciona el régimen fiscal.").max(120),
  usoCfdi: z.string().trim().min(3, "Selecciona el uso de CFDI.").max(80),
  billingStreet: z.string().trim().min(3, "Ingresa calle y número.").max(200),
  billingColonia: z.string().trim().min(2, "Ingresa la colonia.").max(120),
  billingCiudad: z.string().trim().min(2, "Ingresa ciudad o municipio.").max(120),
  billingEstado: z.string().trim().min(2, "Ingresa el estado.").max(80),
  billingPais: z.string().trim().min(2, "Ingresa el país.").max(80),
  billingCodigoPostal: z.string().trim().min(4, "Ingresa el C.P.").max(10),
  billingAddressFull: z.string().trim().min(5, "Ingresa la dirección completa.").max(400),
});

const manualBusinessSchema = z.object({
  businessName: z.string().trim().min(2, "Ingresa el nombre del negocio.").max(120),
  address: z.string().trim().min(5, "Ingresa la dirección del negocio.").max(300),
  category: z.string().trim().min(2, "Indica el giro del negocio.").max(80),
  website: z.string().trim().max(500).optional(),
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
    category?: string | null;
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
      category: data.category ?? null,
    },
    update: {
      businessName: data.businessName,
      website: data.website ?? null,
      googleBusinessUrl: data.googleBusinessUrl ?? null,
      linkageStatus: "pending",
      isManualEntry: data.isManualEntry,
      address: data.address ?? null,
      category: data.category ?? null,
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
}): Promise<LinkSocioResult> {
  try {
    const session = await requireSession();
    const parsed = manualBusinessSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const linkCheck = await assertCanLink(session.id);
    if (!linkCheck.ok) return linkCheck;

    const { businessName, address, category, website } = parsed.data;
    let websiteUrl: string | null = null;
    if (website?.trim()) {
      try {
        new URL(website.trim());
        websiteUrl = website.trim();
      } catch {
        return { ok: false, error: "Ingresa una URL de sitio web válida o déjala vacía." };
      }
    }

    await upsertPendingProfile(session.id, {
      businessName,
      address,
      category,
      website: websiteUrl,
      isManualEntry: true,
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
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const profile = await prisma.socioProfile.findUnique({ where: { userId: session.id } });
    if (!profile && !session.socioId) {
      return { ok: false, error: "Vincula tu negocio antes de editar el perfil." };
    }

    const data = parsed.data;

    await prisma.socioProfile.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        ...data,
        linkageStatus: "pending",
      },
      update: data,
    });

    revalidatePath("/panel");
    revalidatePath("/admin");
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
