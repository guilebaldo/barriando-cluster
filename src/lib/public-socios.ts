import { prisma } from "@/lib/prisma";
import { listaSocios, type Socio, type SocioBenefitInfo } from "@/app/data/socios";
import { compareSociosByPlan, getPlanForSocio, hasCommercialAccess } from "@/lib/membresia";
import { isVisibleInCarousel, isMedianaCarouselPlan } from "@/lib/plan-visibility";
import { isBenefitCurrentlyValid } from "@/lib/benefit-credential";
import type { MembershipPlan } from "@/generated/prisma/client";

const BUSINESS_PLANS: MembershipPlan[] = ["NEGOCIO_FAMILIAR", "MEDIANA_EMPRESA", "GRAN_EMPRESA"];
const ACTIVE_STATUSES = ["active", "manual_active"] as const;

function slugFromName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function dynamicSocioId(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return 900_000 + Math.abs(hash % 99_000);
}

type PublishedUserRow = {
  id: string;
  socioId: number | null;
  subscription: { plan: MembershipPlan; status: string } | null;
  socioProfile: {
    businessName: string | null;
    website: string | null;
    googleBusinessUrl: string | null;
    logoUrl: string | null;
    latitude: number | null;
    longitude: number | null;
    linkageStatus: string | null;
    isManualEntry: boolean | null;
    address: string | null;
    category: string | null;
    offersBenefit: boolean | null;
    benefitTitle: string | null;
    benefitDescription: string | null;
    benefitHowToRedeem: string | null;
    benefitRedeemViaQr: boolean | null;
    benefitValidFrom: Date | null;
    benefitValidUntil: Date | null;
  } | null;
};

/**
 * Negocios con membresía comercial activa.
 * Tras pagar aparecen en /socios sin esperar aprobación editorial (salvo rejected).
 */
async function loadPublishedBusinessUsers(): Promise<PublishedUserRow[]> {
  try {
    return await prisma.user.findMany({
      where: {
        subscription: {
          plan: { in: BUSINESS_PLANS },
          status: { in: [...ACTIVE_STATUSES] },
        },
        socioProfile: {
          businessName: { not: null },
          NOT: { linkageStatus: "rejected" },
        },
      },
      select: {
        id: true,
        socioId: true,
        subscription: { select: { plan: true, status: true } },
        socioProfile: {
          select: {
            businessName: true,
            website: true,
            googleBusinessUrl: true,
            logoUrl: true,
            latitude: true,
            longitude: true,
            linkageStatus: true,
            isManualEntry: true,
            address: true,
            category: true,
            offersBenefit: true,
            benefitTitle: true,
            benefitDescription: true,
            benefitHowToRedeem: true,
            benefitRedeemViaQr: true,
            benefitValidFrom: true,
            benefitValidUntil: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("[public-socios] loadPublishedBusinessUsers failed:", error);
    return [];
  }
}

function profileBenefit(profile: PublishedUserRow["socioProfile"]): SocioBenefitInfo | null {
  if (!profile) return null;
  if (
    !isBenefitCurrentlyValid({
      offersBenefit: Boolean(profile.offersBenefit),
      benefitValidFrom: profile.benefitValidFrom,
      benefitValidUntil: profile.benefitValidUntil,
    })
  ) {
    return null;
  }
  const title = profile.benefitTitle?.trim();
  const description = profile.benefitDescription?.trim();
  const redeemViaQr = Boolean(profile.benefitRedeemViaQr);
  const howToRedeem = profile.benefitHowToRedeem?.trim() || "";
  if (!title || !description) return null;
  if (!redeemViaQr && !howToRedeem) return null;
  return {
    title,
    description,
    howToRedeem: redeemViaQr
      ? howToRedeem || "Muestra este QR al negocio para validar tu membresía."
      : howToRedeem,
    redeemViaQr,
    validFrom: profile.benefitValidFrom?.toISOString() ?? null,
    validUntil: profile.benefitValidUntil?.toISOString() ?? null,
  };
}

function userToSocio(user: PublishedUserRow): Socio | null {
  const sub = user.subscription;
  const profile = user.socioProfile;
  if (!sub || !profile) return null;
  if (profile.linkageStatus === "rejected") return null;
  if (!hasCommercialAccess(sub.plan, sub.status)) return null;

  const coords = {
    latitude: profile.latitude ?? null,
    longitude: profile.longitude ?? null,
    logoUrl: profile.logoUrl?.trim() || null,
  };

  if (user.socioId != null) {
    const catalog = listaSocios.find((s) => s.id === user.socioId);
    if (catalog) {
      return {
        ...catalog,
        name: profile.businessName?.trim() || catalog.name,
        url: profile.website?.trim() || catalog.url,
        direccion: profile.googleBusinessUrl?.trim() || profile.address?.trim() || catalog.direccion,
        categoria: profile.category?.trim() || catalog.categoria,
        benefit: profileBenefit(profile),
        ...coords,
      };
    }
  }

  const name = profile.businessName?.trim();
  if (!name) return null;

  const logoTrim = profile.logoUrl?.trim() || null;
  const foto = logoTrim
    ? logoTrim.replace(/^\/logos\//, "").replace(/\.png$/i, "")
    : slugFromName(name);

  return {
    id: dynamicSocioId(user.id),
    name,
    categoria: profile.category?.trim() || "Negocio certificado",
    foto,
    url: profile.website?.trim() || "#",
    direccion: profile.googleBusinessUrl?.trim() || profile.address?.trim() || undefined,
    benefit: profileBenefit(profile),
    latitude: profile.latitude ?? null,
    longitude: profile.longitude ?? null,
    logoUrl: logoTrim,
  };
}

/** Socios visibles en /socios: catálogo + negocios con plan de pago activo. */
export async function getPublicSociosList(): Promise<Socio[]> {
  const publishedUsers = await loadPublishedBusinessUsers();
  const dynamic = publishedUsers.map(userToSocio).filter(Boolean) as Socio[];

  const catalogIds = new Set(listaSocios.map((s) => s.id));
  const linkedCatalogIds = new Set(
    publishedUsers.filter((u) => u.socioId != null).map((u) => u.socioId as number)
  );

  const merged = [...listaSocios];
  for (const entry of dynamic) {
    if (catalogIds.has(entry.id)) continue;
    merged.push(entry);
  }

  for (const user of publishedUsers) {
    if (user.socioId == null || !linkedCatalogIds.has(user.socioId)) continue;
    const idx = merged.findIndex((s) => s.id === user.socioId);
    const refreshed = userToSocio(user);
    if (idx >= 0 && refreshed) merged[idx] = refreshed;
  }

  return merged.sort(compareSociosByPlan);
}

/** Carrusel destacado: Mediana y Gran Empresa. */
export async function getCarouselSocios(): Promise<Socio[]> {
  const publishedUsers = await loadPublishedBusinessUsers();
  const fromDb = publishedUsers
    .filter((u) => u.subscription && isVisibleInCarousel(u.subscription.plan))
    .map(userToSocio)
    .filter(Boolean) as Socio[];

  const staticEligible = listaSocios.filter((s) => {
    const plan = getPlanForSocio(s);
    return isVisibleInCarousel(plan);
  });

  const seen = new Set<number>();
  const merged: Socio[] = [];

  for (const socio of [...fromDb, ...staticEligible]) {
    if (seen.has(socio.id)) continue;
    seen.add(socio.id);
    merged.push(socio);
  }

  return merged.sort((a, b) => a.name.localeCompare(b.name, "es"));
}

/** Carrusel de la landing: solo Mediana Empresa. */
export async function getMedianaCarouselSocios(): Promise<Socio[]> {
  const publishedUsers = await loadPublishedBusinessUsers();
  const fromDb = publishedUsers
    .filter((u) => u.subscription && isMedianaCarouselPlan(u.subscription.plan))
    .map(userToSocio)
    .filter(Boolean) as Socio[];

  const staticEligible = listaSocios.filter((s) => isMedianaCarouselPlan(getPlanForSocio(s)));

  const seen = new Set<number>();
  const merged: Socio[] = [];

  for (const socio of [...fromDb, ...staticEligible]) {
    if (seen.has(socio.id)) continue;
    seen.add(socio.id);
    merged.push(socio);
  }

  return merged.sort((a, b) => a.name.localeCompare(b.name, "es"));
}
