import { prisma } from "@/lib/prisma";
import { hasCommercialAccess, isBusinessPlan } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";

/**
 * Stable synthetic socioId for businesses that paid but are not in the static catalog.
 * Keep in sync with `dynamicSocioId` in public-socios.ts (900_000+ range).
 */
export function dynamicSocioIdFromUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return 900_000 + Math.abs(hash % 99_000);
}

/**
 * Al activar pago de plan de negocio/empresa:
 * - aprueba vinculación del perfil (si no está rechazada)
 * - asegura fila en CatalogMembership para que aparezca en /admin Operaciones
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

  await ensureCatalogMembershipForPaidUser(userId);
}

/**
 * Upsert roster row for a paid business user so /admin "Todos" shows them
 * even when they are not in the CSV catalog yet.
 */
export async function ensureCatalogMembershipForPaidUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true, socioProfile: true },
  });
  if (!user?.subscription) return false;

  const sub = user.subscription;
  if (!isBusinessPlan(sub.plan) || !hasCommercialAccess(sub.plan, sub.status)) {
    return false;
  }

  const profile = user.socioProfile;
  const businessName =
    profile?.businessName?.trim() ||
    (user.socioId != null ? `Socio #${user.socioId}` : null);
  if (!businessName) return false;

  let socioId = user.socioId;
  if (socioId == null) {
    socioId = dynamicSocioIdFromUserId(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { socioId },
    });
  }

  await prisma.catalogMembership.upsert({
    where: { socioId },
    create: {
      socioId,
      plan: sub.plan,
      status: "active",
      businessName,
      paymentMethod: sub.paymentMethod ?? (sub.stripeSubscriptionId ? "stripe" : null),
      currentPeriodEnd: sub.currentPeriodEnd,
      monthsPastDue: 0,
      offersBenefit: Boolean(profile?.offersBenefit),
      benefitTitle: profile?.benefitTitle ?? null,
      benefitDescription: profile?.benefitDescription ?? null,
      benefitHowToRedeem: profile?.benefitHowToRedeem ?? null,
      benefitRedeemViaQr: Boolean(profile?.benefitRedeemViaQr),
      benefitValidFrom: profile?.benefitValidFrom ?? null,
      benefitValidUntil: profile?.benefitValidUntil ?? null,
    },
    update: {
      plan: sub.plan,
      status: "active",
      businessName,
      paymentMethod: sub.paymentMethod ?? (sub.stripeSubscriptionId ? "stripe" : undefined),
      currentPeriodEnd: sub.currentPeriodEnd,
      monthsPastDue: 0,
    },
  });

  return true;
}

/**
 * Backfill: paid business accounts missing from CatalogMembership → create roster rows.
 * Safe to run on /admin load.
 */
export async function reconcilePaidBusinessesIntoRoster(): Promise<number> {
  try {
    const users = await prisma.user.findMany({
      where: {
        subscription: {
          plan: { in: ["NEGOCIO_FAMILIAR", "MEDIANA_EMPRESA", "GRAN_EMPRESA"] },
          status: { in: ["active", "manual_active"] },
        },
        socioProfile: {
          businessName: { not: null },
          linkageStatus: { not: "rejected" },
        },
      },
      select: { id: true, socioId: true },
    });

    let created = 0;
    for (const user of users) {
      const socioId = user.socioId ?? dynamicSocioIdFromUserId(user.id);
      const existing = await prisma.catalogMembership.findUnique({
        where: { socioId },
        select: { socioId: true },
      });
      const ok = await ensureCatalogMembershipForPaidUser(user.id);
      if (ok && !existing) created += 1;
    }
    return created;
  } catch (error) {
    console.error("[publish-business] reconcilePaidBusinessesIntoRoster failed:", error);
    return 0;
  }
}
