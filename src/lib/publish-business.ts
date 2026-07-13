import { prisma } from "@/lib/prisma";
import { isBusinessPlan } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";

/**
 * Al activar pago de plan de negocio/empresa, publica el perfil en /socios
 * (excepto si fue rechazado).
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
