import { prisma } from "@/lib/prisma";

export type TestimonialPublic = {
  id: string;
  authorName: string;
  businessName: string;
  planTier: string;
  quote: string;
  photoUrl: string | null;
};

export type HomePromoPublic = {
  id: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
};

export async function getPublishedTestimonials(): Promise<TestimonialPublic[]> {
  try {
    return await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        authorName: true,
        businessName: true,
        planTier: true,
        quote: true,
        photoUrl: true,
      },
    });
  } catch {
    return [];
  }
}

export async function getActiveHomePromo(): Promise<HomePromoPublic | null> {
  try {
    const now = new Date();
    const promos = await prisma.homePromo.findMany({
      where: {
        active: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { createdAt: "desc" },
      take: 1,
      select: {
        id: true,
        headline: true,
        body: true,
        ctaLabel: true,
        ctaHref: true,
      },
    });
    return promos[0] ?? null;
  } catch {
    return null;
  }
}
