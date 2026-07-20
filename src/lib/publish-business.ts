import { prisma } from "@/lib/prisma";
import { listaSocios } from "@/app/data/socios";
import { hasCommercialAccess, isBusinessPlan } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";

/** Legacy hashed ids from early Stripe publishes (not consecutive roster ids). */
export const SYNTHETIC_SOCIO_ID_MIN = 900_000;

export function isSyntheticSocioId(id: number | null | undefined): boolean {
  return typeof id === "number" && id >= SYNTHETIC_SOCIO_ID_MIN;
}

/**
 * Next consecutive socioId after the initial CSV seed and any roster/user ids.
 * Ignores legacy synthetic 900_000+ ids when computing the max.
 */
export async function allocateNextSocioId(): Promise<number> {
  const [membershipIds, userIds] = await Promise.all([
    prisma.catalogMembership.findMany({ select: { socioId: true } }),
    prisma.user.findMany({
      where: { socioId: { not: null } },
      select: { socioId: true },
    }),
  ]);

  const catalogMax = listaSocios.reduce((max, s) => Math.max(max, s.id), 0);
  let dbMax = 0;
  for (const row of membershipIds) {
    if (!isSyntheticSocioId(row.socioId)) dbMax = Math.max(dbMax, row.socioId);
  }
  for (const row of userIds) {
    if (row.socioId != null && !isSyntheticSocioId(row.socioId)) {
      dbMax = Math.max(dbMax, row.socioId);
    }
  }

  return Math.max(catalogMax, dbMax) + 1;
}

/**
 * @deprecated Prefer allocateNextSocioId(). Kept briefly for public-socios fallbacks.
 */
export function dynamicSocioIdFromUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return SYNTHETIC_SOCIO_ID_MIN + Math.abs(hash % 99_000);
}

async function migrateSyntheticSocioId(
  userId: string,
  oldSocioId: number
): Promise<number> {
  const newId = await allocateNextSocioId();
  const oldMembership = await prisma.catalogMembership.findUnique({
    where: { socioId: oldSocioId },
  });
  const oldOverride = await prisma.catalogSocioOverride.findUnique({
    where: { socioId: oldSocioId },
  });

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { socioId: newId },
    });

    if (oldMembership) {
      await tx.catalogMembership.delete({ where: { socioId: oldSocioId } });
      await tx.catalogMembership.create({
        data: {
          socioId: newId,
          plan: oldMembership.plan,
          paymentMethod: oldMembership.paymentMethod,
          status: oldMembership.status,
          businessName: oldMembership.businessName,
          category: oldMembership.category,
          currentPeriodEnd: oldMembership.currentPeriodEnd,
          monthsPastDue: oldMembership.monthsPastDue,
          offersBenefit: oldMembership.offersBenefit,
          benefitTitle: oldMembership.benefitTitle,
          benefitDescription: oldMembership.benefitDescription,
          benefitHowToRedeem: oldMembership.benefitHowToRedeem,
          benefitRedeemViaQr: oldMembership.benefitRedeemViaQr,
          benefitValidFrom: oldMembership.benefitValidFrom,
          benefitValidUntil: oldMembership.benefitValidUntil,
        },
      });
    }

    if (oldOverride) {
      await tx.catalogSocioOverride.delete({ where: { socioId: oldSocioId } });
      await tx.catalogSocioOverride.create({
        data: { socioId: newId, website: oldOverride.website },
      });
    }
  });

  return newId;
}

export async function clearRosterExclusion(userId: string): Promise<void> {
  await prisma.socioProfile.updateMany({
    where: { userId },
    data: { rosterExcluded: false },
  });
}

/**
 * Al activar pago de plan de negocio/empresa:
 * - aprueba vinculación del perfil (si no está rechazada)
 * - asegura fila en CatalogMembership para que aparezca en /admin Operaciones
 * - `reinstateRoster`: limpia exclusión admin (pago nuevo / validación / renovar)
 */
export async function publishBusinessPresenceOnPayment(
  userId: string,
  plan: MembershipPlan,
  options?: { reinstateRoster?: boolean }
): Promise<void> {
  if (!isBusinessPlan(plan)) return;

  if (options?.reinstateRoster) {
    await clearRosterExclusion(userId);
  }

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
 * Respects admin `rosterExcluded` (delete from Operaciones).
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
  if (profile?.rosterExcluded) return false;

  const businessName =
    profile?.businessName?.trim() ||
    (user.socioId != null ? `Socio #${user.socioId}` : null);
  if (!businessName) return false;

  const category = profile?.category?.trim() || null;

  let socioId = user.socioId;
  if (socioId == null) {
    socioId = await allocateNextSocioId();
    await prisma.user.update({
      where: { id: user.id },
      data: { socioId },
    });
  } else if (isSyntheticSocioId(socioId)) {
    socioId = await migrateSyntheticSocioId(user.id, socioId);
  }

  await prisma.catalogMembership.upsert({
    where: { socioId },
    create: {
      socioId,
      plan: sub.plan,
      status: "active",
      businessName,
      category,
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
      ...(category ? { category } : {}),
      paymentMethod: sub.paymentMethod ?? (sub.stripeSubscriptionId ? "stripe" : undefined),
      currentPeriodEnd: sub.currentPeriodEnd,
      monthsPastDue: 0,
    },
  });

  return true;
}

/**
 * Backfill: paid business accounts missing from CatalogMembership → create roster rows.
 * Also migrates legacy synthetic socioIds to consecutive ids.
 * Skips profiles marked rosterExcluded by admin.
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
          rosterExcluded: false,
        },
      },
      select: { id: true, socioId: true },
    });

    let touched = 0;
    for (const user of users) {
      const before = user.socioId;
      const ok = await ensureCatalogMembershipForPaidUser(user.id);
      if (!ok) continue;
      const after = (
        await prisma.user.findUnique({
          where: { id: user.id },
          select: { socioId: true },
        })
      )?.socioId;
      if (before == null || isSyntheticSocioId(before) || before !== after) {
        touched += 1;
      }
    }
    return touched;
  } catch (error) {
    console.error("[publish-business] reconcilePaidBusinessesIntoRoster failed:", error);
    return 0;
  }
}
