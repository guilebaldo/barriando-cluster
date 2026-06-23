"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-utils";
import { listaSocios } from "@/app/data/socios";
import { getPlanForSocio, getPlanLabel } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";

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

    const plan = getPlanForSocio(socio);

    await prisma.user.update({
      where: { id: session.id },
      data: { socioId },
    });

    await prisma.subscription.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        plan,
        status: "manual_active",
      },
      update: {
        plan,
        status: "manual_active",
      },
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
