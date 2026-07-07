import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { MembershipPlan } from "@/generated/prisma/client";

export type LiveStats = {
  approvedSocios: number;
  stampsLast30Days: number;
  subscriptionsByPlan: Partial<Record<MembershipPlan, number>>;
};

async function fetchLiveStats(): Promise<LiveStats> {
  const empty: LiveStats = {
    approvedSocios: 0,
    stampsLast30Days: 0,
    subscriptionsByPlan: {},
  };

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [approvedSocios, stampsLast30Days, subscriptions] = await Promise.all([
      prisma.socioProfile.count({ where: { linkageStatus: "approved" } }),
      prisma.stamp.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.subscription.groupBy({
        by: ["plan"],
        where: { status: { in: ["active", "manual_active"] } },
        _count: { plan: true },
      }),
    ]);

    const subscriptionsByPlan: Partial<Record<MembershipPlan, number>> = {};
    for (const row of subscriptions) {
      subscriptionsByPlan[row.plan] = row._count.plan;
    }

    return { approvedSocios, stampsLast30Days, subscriptionsByPlan };
  } catch {
    return empty;
  }
}

export const getLiveStats = unstable_cache(fetchLiveStats, ["live-stats"], { revalidate: 3600 });
