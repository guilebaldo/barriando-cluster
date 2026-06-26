"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-utils";
import { listaSocios } from "@/app/data/socios";
import { canLinkSocioAccount, getPlanForSocio, getPlanLabel } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";

const profileSchema = z.object({
  businessName: z.string().trim().min(2, "Ingresa el nombre del negocio.").max(120),
  website: z.string().trim().url("Ingresa una URL válida para el sitio web.").max(500),
  googleBusinessUrl: z
    .string()
    .trim()
    .url("Ingresa una URL válida de Google My Business.")
    .max(500),
  logoUrl: z.string().trim().max(500).optional(),
});

export type LinkSocioResult =
  | { ok: true; socioName: string; plan: MembershipPlan; planLabel: string }
  | { ok: false; error: string };

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

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.id },
    });
    if (!subscription || !canLinkSocioAccount(subscription.status)) {
      return {
        ok: false,
        error:
          "Solo puedes vincular tu negocio cuando tu pago esté verificado (tarjeta activa o transferencia confirmada).",
      };
    }

    const plan = getPlanForSocio(socio);

    await prisma.user.update({
      where: { id: session.id },
      data: { socioId },
    });

    await prisma.subscription.update({
      where: { userId: session.id },
      data: { plan },
    });

    revalidatePath("/panel");

    return {
      ok: true,
      socioName: socio.name,
      plan,
      planLabel: getPlanLabel(plan),
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo vincular el negocio. Intenta de nuevo." };
  }
}

export type ReportPaymentResult = { ok: true } | { ok: false; error: string };

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

export async function updateSocioProfile(input: {
  businessName: string;
  website: string;
  googleBusinessUrl: string;
  logoUrl?: string;
}): Promise<UpdateProfileResult> {
  try {
    const session = await requireSession();
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    if (!session.socioId) {
      return { ok: false, error: "Vincula tu negocio antes de editar el perfil." };
    }

    const { businessName, website, googleBusinessUrl, logoUrl } = parsed.data;

    if (logoUrl && logoUrl.length > 0) {
      try {
        new URL(logoUrl);
      } catch {
        return { ok: false, error: "Ingresa una URL pública de imagen válida." };
      }
    }

    await prisma.socioProfile.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        businessName,
        website,
        googleBusinessUrl,
        logoUrl: logoUrl || null,
      },
      update: {
        businessName,
        website,
        googleBusinessUrl,
        logoUrl: logoUrl || null,
      },
    });

    revalidatePath("/panel");
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

    if (plan === "VECINO") {
      return { ok: false, error: "Selecciona un plan de pago." };
    }

    await prisma.subscription.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        plan,
        status: "manual_pending",
        manualPaymentNote: note?.trim() || null,
      },
      update: {
        plan,
        status: "manual_pending",
        manualPaymentNote: note?.trim() || null,
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
