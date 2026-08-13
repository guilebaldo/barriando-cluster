import { prisma } from "@/lib/prisma";
import {
  STAMP_COOLDOWN_MS,
  STAMP_STATUS_VALIDATED,
  findRestaurantBySlugAsync,
  type StampSummary,
} from "@/lib/pasaporte";
import { resolveSocioMapCoord } from "@/lib/socio-map-coords";
import { haversineDistanceKm } from "@/lib/map-route-client";
import { STAMP_MAX_DISTANCE_M } from "@/lib/pasaporte-stamp-limits";

export { STAMP_MAX_DISTANCE_M };

export type CreateStampResult =
  | { ok: true; stampId: string; restaurantName: string; cooldown: false }
  | { ok: true; cooldown: true; restaurantName: string; retryAfterMs: number }
  | {
      ok: false;
      error:
        | "invalid_restaurant"
        | "unauthorized"
        | "location_required"
        | "too_far"
        | "invalid_location"
        | "rate_limited";
      restaurantName?: string;
      distanceM?: number;
      maxDistanceM?: number;
    };

export type StampLocation = {
  latitude: number;
  longitude: number;
  accuracyM?: number | null;
};

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export async function createStampForUser(
  userId: string,
  restaurantSlug: string,
  location?: StampLocation | null
): Promise<CreateStampResult> {
  const restaurant = await findRestaurantBySlugAsync(restaurantSlug);
  if (!restaurant) {
    return { ok: false, error: "invalid_restaurant" };
  }

  const venue = resolveSocioMapCoord(restaurant);
  if (venue) {
    if (
      !location ||
      !isValidCoord(location.latitude, location.longitude)
    ) {
      return {
        ok: false,
        error: "location_required",
        restaurantName: restaurant.name,
      };
    }

    const distanceKm = haversineDistanceKm(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: venue.lat, longitude: venue.lng }
    );
    const distanceM = distanceKm * 1000;
    // Tolerancia por precisión reportada del GPS (tope 80 m).
    const accuracyPad = Math.min(Math.max(location.accuracyM ?? 0, 0), 80);
    const maxM = STAMP_MAX_DISTANCE_M + accuracyPad;
    if (distanceM > maxM) {
      return {
        ok: false,
        error: "too_far",
        restaurantName: restaurant.name,
        distanceM: Math.round(distanceM),
        maxDistanceM: Math.round(maxM),
      };
    }
  } else if (location && !isValidCoord(location.latitude, location.longitude)) {
    return { ok: false, error: "invalid_location", restaurantName: restaurant.name };
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

function leaderFirstName(nombre: string | null, email: string | null): string {
  const raw =
    nombre?.trim() ||
    email?.split("@")[0]?.replace(/[._-]+/g, " ").trim() ||
    "Viajero";
  const first = raw.split(/\s+/).find(Boolean) ?? "Viajero";
  return first.toLocaleUpperCase("es-MX");
}

/** Primeros lugares del pasaporte por negocios distintos sellados. */
export async function loadPassportLeaderNames(limit = 10): Promise<string[]> {
  const groups = await prisma.stamp.groupBy({
    by: ["userId", "restaurantId"],
    where: { status: STAMP_STATUS_VALIDATED },
  });
  if (groups.length === 0) return [];

  const uniqueByUser = new Map<string, number>();
  for (const row of groups) {
    uniqueByUser.set(row.userId, (uniqueByUser.get(row.userId) ?? 0) + 1);
  }

  const ranked = [...uniqueByUser.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, Math.max(1, limit));

  const users = await prisma.user.findMany({
    where: { id: { in: ranked.map(([id]) => id) } },
    select: { id: true, nombre: true, email: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return ranked.map(([id]) => {
    const user = byId.get(id);
    return leaderFirstName(user?.nombre ?? null, user?.email ?? null);
  });
}
