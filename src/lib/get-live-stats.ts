import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { listaHitos } from "@/app/data/hitos";
import { getPublicSociosList } from "@/lib/public-socios";
import type { MembershipPlan } from "@/generated/prisma/client";

const ACTIVE_STATUSES = ["active", "manual_active"] as const;

export type LiveStats = {
  mapMilestones: number;
  /** Negocios en /socios + vecinos con membresía activa. */
  totalSocios: number;
  /** Negocios que aparecen en /socios. */
  certifiedBusinesses: number;
  /** Cuentas con plan Turista. */
  registeredTourists: number;
  totalStamps: number;
  /** Usuarios con al menos un sello en el Pasaporte Digital. */
  sealedPassports: number;
  /** @deprecated use certifiedBusinesses */
  approvedSocios: number;
  stampsLast30Days: number;
  subscriptionsByPlan: Partial<Record<MembershipPlan, number>>;
};

async function fetchLiveStats(): Promise<LiveStats> {
  const empty: LiveStats = {
    mapMilestones: 0,
    totalSocios: 0,
    certifiedBusinesses: 0,
    registeredTourists: 0,
    totalStamps: 0,
    sealedPassports: 0,
    approvedSocios: 0,
    stampsLast30Days: 0,
    subscriptionsByPlan: {},
  };

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      publicSocios,
      activeVecinos,
      registeredTourists,
      totalStamps,
      sealedPassportGroups,
      stampsLast30Days,
      subscriptions,
    ] = await Promise.all([
      getPublicSociosList(),
      prisma.user.count({
        where: {
          subscription: {
            plan: "VECINO",
            status: { in: [...ACTIVE_STATUSES] },
          },
        },
      }),
      prisma.user.count({
        where: {
          subscription: { plan: "TURISTA" },
        },
      }),
      prisma.stamp.count(),
      prisma.stamp.groupBy({
        by: ["userId"],
      }),
      prisma.stamp.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.subscription.groupBy({
        by: ["plan"],
        where: { status: { in: [...ACTIVE_STATUSES] } },
        _count: { plan: true },
      }),
    ]);

    const certifiedBusinesses = publicSocios.length;
    const mapMilestones = listaHitos.length;
    const totalSocios = certifiedBusinesses + activeVecinos;
    const sealedPassports = sealedPassportGroups.length;

    const subscriptionsByPlan: Partial<Record<MembershipPlan, number>> = {};
    for (const row of subscriptions) {
      subscriptionsByPlan[row.plan] = row._count.plan;
    }

    return {
      mapMilestones,
      totalSocios,
      certifiedBusinesses,
      registeredTourists,
      totalStamps,
      sealedPassports,
      approvedSocios: certifiedBusinesses,
      stampsLast30Days,
      subscriptionsByPlan,
    };
  } catch {
    return empty;
  }
}

export const getLiveStats = unstable_cache(fetchLiveStats, ["live-stats-v3"], {
  revalidate: 300,
});
