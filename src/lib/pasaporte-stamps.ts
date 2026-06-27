import { prisma } from "@/lib/prisma";
import {
  STAMP_COOLDOWN_MS,
  STAMP_STATUS_VALIDATED,
  findRestaurantBySlug,
  type StampSummary,
} from "@/lib/pasaporte";

export type CreateStampResult =
  | { ok: true; stampId: string; restaurantName: string; cooldown: false }
  | { ok: true; cooldown: true; restaurantName: string; retryAfterMs: number }
  | { ok: false; error: "invalid_restaurant" | "unauthorized" };

export async function createStampForUser(
  userId: string,
  restaurantSlug: string
): Promise<CreateStampResult> {
  const restaurant = findRestaurantBySlug(restaurantSlug);
  if (!restaurant) {
    return { ok: false, error: "invalid_restaurant" };
  }

  const since = new Date(Date.now() - STAMP_COOLDOWN_MS);
  const recent = await prisma.stamp.findFirst({
    where: {
      userId,
      restaurantId: restaurant.id,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recent) {
    const retryAfterMs = recent.createdAt.getTime() + STAMP_COOLDOWN_MS - Date.now();
    return {
      ok: true,
      cooldown: true,
      restaurantName: restaurant.name,
      retryAfterMs: Math.max(retryAfterMs, 0),
    };
  }

  const stamp = await prisma.stamp.create({
    data: {
      userId,
      restaurantId: restaurant.id,
      status: STAMP_STATUS_VALIDATED,
    },
  });

  return {
    ok: true,
    cooldown: false,
    stampId: stamp.id,
    restaurantName: restaurant.name,
  };
}

export async function loadUserStampSummaries(userId: string): Promise<StampSummary[]> {
  const stamps = await prisma.stamp.findMany({
    where: { userId, status: STAMP_STATUS_VALIDATED },
    orderBy: { createdAt: "desc" },
  });

  const byRestaurant = new Map<number, { count: number; lastStampAt: Date }>();

  for (const stamp of stamps) {
    const existing = byRestaurant.get(stamp.restaurantId);
    if (!existing) {
      byRestaurant.set(stamp.restaurantId, { count: 1, lastStampAt: stamp.createdAt });
      continue;
    }
    existing.count += 1;
    if (stamp.createdAt > existing.lastStampAt) {
      existing.lastStampAt = stamp.createdAt;
    }
  }

  return Array.from(byRestaurant.entries()).map(([restaurantId, data]) => ({
    restaurantId,
    count: data.count,
    lastStampAt: data.lastStampAt.toISOString(),
  }));
}

export async function countUserStamps(userId: string): Promise<number> {
  return prisma.stamp.count({
    where: { userId, status: STAMP_STATUS_VALIDATED },
  });
}
