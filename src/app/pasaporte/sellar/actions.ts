"use server";

import { requireSession } from "@/lib/auth-utils";
import { createStampForUser, type CreateStampResult } from "@/lib/pasaporte-stamps";
import { rateLimit } from "@/lib/rate-limit";

export async function confirmStampWithLocation(input: {
  restaurantSlug: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracyM?: number | null;
}): Promise<CreateStampResult> {
  try {
    const session = await requireSession();
    const limit = await rateLimit({
      bucketKey: `stamp:user:${session.id}`,
      limit: 30,
      windowSeconds: 60 * 60,
    });
    if (!limit.ok) {
      return { ok: false, error: "rate_limited" };
    }

    const hasLocation =
      typeof input.latitude === "number" &&
      typeof input.longitude === "number" &&
      Number.isFinite(input.latitude) &&
      Number.isFinite(input.longitude);

    return createStampForUser(
      session.id,
      input.restaurantSlug,
      hasLocation
        ? {
            latitude: input.latitude!,
            longitude: input.longitude!,
            accuracyM: input.accuracyM,
          }
        : null
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "unauthorized" };
    }
    return { ok: false, error: "invalid_restaurant" };
  }
}
