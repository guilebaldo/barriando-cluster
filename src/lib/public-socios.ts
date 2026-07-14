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

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

type CatalogMembershipRow = {
  socioId: number;
  plan: MembershipPlan;
  status: string;
  businessName: string | null;
  offersBenefit: boolean | null;
  benefitTitle: string | null;
  benefitDescription: string | null;
  benefitHowToRedeem: string | null;
  benefitRedeemViaQr: boolean | null;
  benefitValidFrom: Date | null;
  benefitValidUntil: Date | null;
};

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

async function loadActiveCatalogMemberships(): Promise<Map<number, CatalogMembershipRow>> {
  try {
    const rows = await prisma.catalogMembership.findMany({
      where: { status: "active", plan: { in: BUSINESS_PLANS } },
      select: {
        socioId: true,
        plan: true,
        status: true,
        businessName: true,
        offersBenefit: true,
        benefitTitle: true,
        benefitDescription: true,
        benefitHowToRedeem: true,
        benefitRedeemViaQr: true,
        benefitValidFrom: true,
        benefitValidUntil: true,
      },
    });
    return new Map(rows.map((r) => [r.socioId, r]));
  } catch (error) {
    console.error("[public-socios] loadActiveCatalogMemberships failed:", error);
    return new Map();
  }
}

async function loadCatalogWebsiteOverrides(): Promise<Map<number, string>> {
  try {
    const rows = await prisma.catalogSocioOverride.findMany({
      select: { socioId: true, website: true },
    });
    const map = new Map<number, string>();
    for (const row of rows) {
      const website = row.website?.trim();
      if (website) map.set(row.socioId, website);
    }
    return map;
  } catch (error) {
    console.error("[public-socios] loadCatalogWebsiteOverrides failed:", error);
    return new Map();
  }
}

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

function toSocioBenefit(input: {
  offersBenefit: boolean | null | undefined;
  benefitTitle: string | null | undefined;
  benefitDescription: string | null | undefined;
  benefitHowToRedeem: string | null | undefined;
  benefitRedeemViaQr: boolean | null | undefined;
  benefitValidFrom: Date | null | undefined;
  benefitValidUntil: Date | null | undefined;
}): SocioBenefitInfo | null {
  if (
    !isBenefitCurrentlyValid({
      offersBenefit: Boolean(input.offersBenefit),
      benefitValidFrom: input.benefitValidFrom ?? null,
      benefitValidUntil: input.benefitValidUntil ?? null,
    })
  ) {
    return null;
  }
  const title = input.benefitTitle?.trim();
  const description = input.benefitDescription?.trim();
  const redeemViaQr = Boolean(input.benefitRedeemViaQr);
  const howToRedeem = input.benefitHowToRedeem?.trim() || "";
  if (!title || !description) return null;
  if (!redeemViaQr && !howToRedeem) return null;
  return {
    title,
    description,
    howToRedeem: redeemViaQr
      ? howToRedeem || "Muestra este QR al negocio para validar tu membresía."
      : howToRedeem,
    redeemViaQr,
    validFrom: input.benefitValidFrom?.toISOString() ?? null,
    validUntil: input.benefitValidUntil?.toISOString() ?? null,
  };
}

function profileBenefit(profile: PublishedUserRow["socioProfile"]): SocioBenefitInfo | null {
  if (!profile) return null;
  return toSocioBenefit(profile);
}

function rosterBenefit(membership: CatalogMembershipRow): SocioBenefitInfo | null {
  return toSocioBenefit(membership);
}

function catalogSocioFromRoster(
  socioId: number,
  membership: CatalogMembershipRow,
  websiteOverrides: Map<number, string>
): Socio | null {
  const catalog = listaSocios.find((s) => s.id === socioId);
  if (!catalog) return null;
  const overrideUrl = websiteOverrides.get(socioId);
  return {
    ...catalog,
    name: membership.businessName?.trim() || catalog.name,
    url: overrideUrl || catalog.url,
    membershipPlan: membership.plan as Socio["membershipPlan"],
    benefit: rosterBenefit(membership),
  };
}

function userToSocio(
  user: PublishedUserRow,
  websiteOverrides: Map<number, string> = new Map(),
  memberships: Map<number, CatalogMembershipRow> = new Map()
): Socio | null {
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
      const roster = memberships.get(catalog.id);
      const overrideUrl = websiteOverrides.get(catalog.id);
      return {
        ...catalog,
        name: profile.businessName?.trim() || roster?.businessName?.trim() || catalog.name,
        url: profile.website?.trim() || overrideUrl || catalog.url,
        direccion: profile.googleBusinessUrl?.trim() || profile.address?.trim() || catalog.direccion,
        categoria: profile.category?.trim() || catalog.categoria,
        benefit: profileBenefit(profile) || (roster ? rosterBenefit(roster) : null),
        membershipPlan: sub.plan as Socio["membershipPlan"],
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
    membershipPlan: sub.plan as Socio["membershipPlan"],
    latitude: profile.latitude ?? null,
    longitude: profile.longitude ?? null,
    logoUrl: logoTrim,
  };
}

/** Prefer linked user overlay, then catalog roster; drop name duplicates. */
function dedupeByName(socios: Socio[]): Socio[] {
  const rank = (s: Socio) => {
    if (s.id < 900_000 && (s.logoUrl || s.benefit)) return 0;
    if (s.id < 900_000) return 1;
    return 2;
  };
  const best = new Map<string, Socio>();
  for (const socio of socios) {
    const key = normalizeName(socio.name);
    if (!key) continue;
    const prev = best.get(key);
    if (!prev || rank(socio) < rank(prev)) best.set(key, socio);
  }
  return [...best.values()];
}

/** Socios visibles en /socios: solo membresía de negocio activa (roster o usuario). */
export async function getPublicSociosList(): Promise<Socio[]> {
  const [publishedUsers, websiteOverrides, memberships] = await Promise.all([
    loadPublishedBusinessUsers(),
    loadCatalogWebsiteOverrides(),
    loadActiveCatalogMemberships(),
  ]);

  const fromRoster: Socio[] = [];
  for (const [socioId, membership] of memberships) {
    const entry = catalogSocioFromRoster(socioId, membership, websiteOverrides);
    if (entry) fromRoster.push(entry);
  }

  const fromUsers = publishedUsers
    .map((user) => userToSocio(user, websiteOverrides, memberships))
    .filter(Boolean) as Socio[];

  // Overlay linked users onto roster ids first.
  const byId = new Map<number, Socio>();
  for (const socio of fromRoster) byId.set(socio.id, socio);
  for (const socio of fromUsers) {
    if (socio.id < 900_000) {
      byId.set(socio.id, socio);
    }
  }

  const linkedIds = new Set(
    publishedUsers.filter((u) => u.socioId != null).map((u) => u.socioId as number)
  );
  const dynamicOnly = fromUsers.filter((s) => s.id >= 900_000);
  // Drop dynamic entries whose name matches a catalog/roster id already present.
  const rosterNames = new Set([...byId.values()].map((s) => normalizeName(s.name)));
  for (const socio of dynamicOnly) {
    if (rosterNames.has(normalizeName(socio.name))) continue;
    byId.set(socio.id, socio);
  }

  // Prefer newest user overlay for linked catalog ids (already set).
  void linkedIds;

  return dedupeByName([...byId.values()]).sort(compareSociosByPlan);
}

/** Carrusel destacado: Mediana y Gran Empresa. */
export async function getCarouselSocios(): Promise<Socio[]> {
  const list = await getPublicSociosList();
  return list
    .filter((s) => isVisibleInCarousel(getPlanForSocio(s)))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

/** Carrusel de la landing: solo Mediana Empresa. */
export async function getMedianaCarouselSocios(): Promise<Socio[]> {
  const list = await getPublicSociosList();
  return list
    .filter((s) => isMedianaCarouselPlan(getPlanForSocio(s)))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

/** Active catalog socioIds with GRAN_EMPRESA (for MAP). */
export async function getActiveGranEmpresaCatalogIds(): Promise<Set<number>> {
  const memberships = await loadActiveCatalogMemberships();
  const ids = new Set<number>();
  for (const [socioId, m] of memberships) {
    if (m.plan === "GRAN_EMPRESA") ids.add(socioId);
  }
  return ids;
}

export async function getActiveCatalogMembershipIds(): Promise<Set<number>> {
  const memberships = await loadActiveCatalogMemberships();
  return new Set(memberships.keys());
}
