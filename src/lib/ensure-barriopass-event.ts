import { prisma } from "@/lib/prisma";
import {
  BARRIOPASS_ATTRACTIONS,
  BARRIOPASS_LAT,
  BARRIOPASS_LNG,
  BARRIOPASS_SKUS,
  BARRIOPASS_VENUE,
  type BarrioPassSku,
} from "@/lib/barriopass";

function catalogDescription(sku: BarrioPassSku): string {
  const product = BARRIOPASS_SKUS[sku];
  const included = BARRIOPASS_ATTRACTIONS.filter((a) => a.included)
    .map((a) => a.name)
    .join(" y ");
  const optional = BARRIOPASS_ATTRACTIONS.filter((a) => !a.included)
    .map((a) => a.name)
    .join(", ");
  if (sku === "c3") {
    return `Elige 3 atracciones. Menú: ${included}, ${optional}. Una admisión por sede. Válido 9 días desde el primer uso.`;
  }
  return `Incluye ${included}, más 3 a elegir entre ${optional}. Una admisión por sede. Válido 9 días desde el primer uso.`;
}

export async function ensureBarrioPassEvent(sku: BarrioPassSku) {
  const product = BARRIOPASS_SKUS[sku];
  const startsAt = new Date("2026-01-01T06:00:00.000Z");
  const endsAt = new Date("2028-12-31T06:00:00.000Z");
  const priceCents = product.adultMxn * 100;
  const description = catalogDescription(sku);

  const existing = await prisma.accessEvent.findFirst({
    where: { title: product.eventTitle },
    select: { id: true },
  });

  if (existing) {
    return prisma.accessEvent.update({
      where: { id: existing.id },
      data: {
        description,
        venue: BARRIOPASS_VENUE,
        latitude: BARRIOPASS_LAT,
        longitude: BARRIOPASS_LNG,
        priceCents,
        published: true,
        capacity: null,
        endsAt,
      },
    });
  }

  return prisma.accessEvent.create({
    data: {
      title: product.eventTitle,
      description,
      venue: BARRIOPASS_VENUE,
      latitude: BARRIOPASS_LAT,
      longitude: BARRIOPASS_LNG,
      startsAt,
      endsAt,
      priceCents,
      published: true,
      capacity: null,
    },
  });
}
