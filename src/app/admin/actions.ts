"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-utils";
import { isAdminEmail } from "@/lib/admin";
import { listaSocios } from "@/app/data/socios";
import { getPlanLabel } from "@/lib/membresia";

export type ApproveResult = { ok: true } | { ok: false; error: string };

export async function approveManualCertification(userId: string): Promise<ApproveResult> {
  try {
    const session = await requireSession();
    if (!isAdminEmail(session.email)) {
      return { ok: false, error: "No autorizado." };
    }

    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) {
      return { ok: false, error: "El usuario no tiene suscripción." };
    }

    await prisma.subscription.update({
      where: { userId },
      data: { status: "manual_active" },
    });

    revalidatePath("/admin");
    revalidatePath("/panel");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo aprobar la certificación." };
  }
}

export type AdminUserRow = {
  id: string;
  nombre: string;
  email: string;
  socioId: number | null;
  socioName: string | null;
  plan: string;
  planLabel: string;
  status: string;
  createdAt: string;
  manualPaymentNote: string | null;
};

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const session = await requireSession();
  if (!isAdminEmail(session.email)) {
    throw new Error("FORBIDDEN");
  }

  const users = await prisma.user.findMany({
    include: { subscription: true, socioProfile: true },
    orderBy: { createdAt: "desc" },
  });

  return users.map((user) => {
    const catalogSocio = user.socioId ? listaSocios.find((s) => s.id === user.socioId) : null;
    const businessName =
      user.socioProfile?.businessName ?? catalogSocio?.name ?? null;
    const plan = user.subscription?.plan ?? "VECINO";

    return {
      id: user.id,
      nombre: user.nombre ?? user.email ?? "—",
      email: user.email ?? "—",
      socioId: user.socioId,
      socioName: businessName,
      plan,
      planLabel: getPlanLabel(plan),
      status: user.subscription?.status ?? "inactive",
      createdAt: user.createdAt.toISOString(),
      manualPaymentNote: user.subscription?.manualPaymentNote ?? null,
    };
  });
}
