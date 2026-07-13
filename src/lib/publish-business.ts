import { prisma } from "@/lib/prisma";
import { isBusinessPlan } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";

/**
 * Al activar el pago de un plan de negocio, publica el perfil para /socios y pasaporte
 * (salvo que haya sido rechazado explícitamente).
 */
export async function publishBusinessPresenceOnPayment(
  userId: string,
  plan: MembershipPlan
): Promise<void> {
  if (!isBusinessPlan(plan)) return;

  await prisma.socioProfile.updateMany({
    where: {
      userId,
      linkageStatus: { not: "rejected" },
      businessName: { not: null },
    },
    data: { linkageStatus: "approved" },
  });
}
