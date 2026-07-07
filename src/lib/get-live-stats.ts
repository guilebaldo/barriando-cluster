import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { MembershipPlan } from "@/generated/prisma/client";

const COMMERCIAL_PLANS: MembershipPlan[] = ["NEGOCIO_FAMILIAR", "MEDIANA_EMPRESA", "GRAN_EMPRESA"];
const ACTIVE_STATUSES = ["active", "manual_active"] as const;

export type LiveStats = {
  mapMilestones: number;
  totalSocios: number;
  certifiedBusinesses: number;
  registeredTourists: number;
  totalStamps: number;
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
    approvedSocios: 0,
    stampsLast30Days: 0,
    subscriptionsByPlan: {},
  };

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      mapMilestones,
      totalSocios,
      certifiedBusinesses,
      registeredTourists,
      totalStamps,
      stampsLast30Days,
      subscriptions,
    ] = await Promise.all([
      prisma.mapMilestone.count({ where: { active: true } }),
      prisma.user.count({ where: { subscription: { isNot: null } } }),
      prisma.user.count({
        where: {
          subscription: {
            plan: { in: COMMERCIAL_PLANS },
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
      prisma.stamp.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.subscription.groupBy({
        by: ["plan"],
        where: { status: { in: [...ACTIVE_STATUSES] } },
        _count: { plan: true },
      }),
    ]);

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
      approvedSocios: certifiedBusinesses,
      stampsLast30Days,
      subscriptionsByPlan,
    };
  } catch {
    return empty;
  }
}

export const getLiveStats = unstable_cache(fetchLiveStats, ["live-stats"], { revalidate: 3600 });
