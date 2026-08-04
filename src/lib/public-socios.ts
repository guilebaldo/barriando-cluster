import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { listaSocios, type Socio, type SocioBenefitInfo } from "@/app/data/socios";
import { sociosCoords } from "@/app/data/socios-coords";
import { compareSociosByPlan, getPlanForSocio, hasCommercialAccess } from "@/lib/membresia";
import { isVisibleInCarousel, isMedianaCarouselPlan } from "@/lib/plan-visibility";
import { isBenefitCurrentlyValid } from "@/lib/benefit-credential";
import { haversineDistanceKm } from "@/lib/map-route-client";
import {
  dynamicSocioIdFromUserId,
  isSyntheticSocioId,
} from "@/lib/publish-business";
import { PUBLIC_SOCIOS_TAG } from "@/lib/public-socios-tag";
import { resolveSocioDisplayName } from "@/lib/socio-display-name";
import type { MembershipPlan } from "@/generated/prisma/client";

/** Si Business está a más de esto del pin curado, suele ser viewport de embed (no el pin). */
const CATALOG_PIN_TRUST_KM = 0.85;

function rosterMapCoord(
  socioId: number,
  biz: { latitude: number | null; longitude: number | null } | undefined,
  catalogFallback: { latitude?: number | null; longitude?: number | null } | undefined
): { latitude: number | null; longitude: number | null } {
  const curated = sociosCoords[socioId];
  const hasBiz =
    typeof biz?.latitude === "number" &&
    typeof biz?.longitude === "number" &&
    Number.isFinite(biz.latitude) &&
    Number.isFinite(biz.longitude);

  if (curated && hasBiz) {
    const d = haversineDistanceKm(
      { latitude: curated.lat, longitude: curated.lng },
      { latitude: biz.latitude!, longitude: biz.longitude! }
    );
    // Ajuste fino de admin cerca del pin → Business. Embed a km → catálogo.
    if (d <= CATALOG_PIN_TRUST_KM) {
      return { latitude: biz.latitude!, longitude: biz.longitude! };
    }
    return { latitude: curated.lat, longitude: curated.lng };
  }

  if (curated) return { latitude: curated.lat, longitude: curated.lng };
  if (hasBiz) return { latitude: biz!.latitude, longitude: biz!.longitude };
  return {
    latitude: catalogFallback?.latitude ?? null,
    longitude: catalogFallback?.longitude ?? null,
  };
}

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

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** "Guayé" vs "Guayé Mezcalería Experimental" count as the same business. */
function namesReferToSameBusiness(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const [short, long] = na.length <= nb.length ? [na, nb] : [nb, na];
  if (short.length < 4) return false;
  return (
    long === short ||
    long.startsWith(`${short} `) ||
    long.endsWith(` ${short}`) ||
    long.includes(` ${short} `)
  );
}

/** Solo URLs http(s) para el botón Google Maps (no dirección postal). */
function mapsLinkFrom(...candidates: Array<string | null | undefined>): string | undefined {
  for (const raw of candidates) {
    const value = raw?.trim();
    if (value && /^https?:\/\//i.test(value)) return value;
  }
  return undefined;
}

type CatalogMembershipRow = {
  socioId: number;
  plan: MembershipPlan;
  status: string;
  businessName: string | null;
  category: string | null;
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
        category: true,
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
 * El pago (plan + status) valida la aparición en /cuponera; no se exige vinculación aprobada a mano.
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
          rosterExcluded: false,
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
  websiteOverrides: Map<number, string>,
  businesses: Map<number, { website: string | null; mapsUrl: string | null; latitude: number | null; longitude: number | null }>
): Socio | null {
  const catalog = listaSocios.find((s) => s.id === socioId);
  const name = resolveSocioDisplayName(socioId, membership.businessName, catalog?.name);
  if (!name || /^socio\s*#?\s*\d+$/i.test(name)) return null;

  const overrideUrl = websiteOverrides.get(socioId);
  const biz = businesses.get(socioId);
  const foto = catalog?.foto || slugFromName(name);
  const coords = rosterMapCoord(socioId, biz, catalog);

  return {
    id: socioId,
    name,
    categoria:
      membership.category?.trim() || catalog?.categoria || "Negocio certificado",
    foto,
    url: overrideUrl || biz?.website?.trim() || catalog?.url || "#",
    direccion: mapsLinkFrom(biz?.mapsUrl, catalog?.direccion),
    membershipPlan: membership.plan as Socio["membershipPlan"],
    benefit: rosterBenefit(membership),
    latitude: coords.latitude,
    longitude: coords.longitude,
    logoUrl: catalog?.logoUrl ?? null,
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
  if (!hasCommercialAccess(sub.plan, sub.status)) return null;

  const coords = {
    latitude: profile.latitude ?? null,
    longitude: profile.longitude ?? null,
    logoUrl: profile.logoUrl?.trim() || null,
  };

  const name = profile.businessName?.trim();
  if (!name) return null;

  const socioId = user.socioId ?? dynamicSocioIdFromUserId(user.id);

  const catalog = listaSocios.find((s) => s.id === socioId);
  const roster = memberships.get(socioId);
  const overrideUrl = websiteOverrides.get(socioId);

  if (catalog) {
    return {
      ...catalog,
      name: resolveSocioDisplayName(
        socioId,
        name,
        roster?.businessName,
        catalog.name
      ),
      url: profile.website?.trim() || overrideUrl || catalog.url,
      direccion: mapsLinkFrom(profile.googleBusinessUrl, catalog.direccion),
      categoria:
        profile.category?.trim() ||
        roster?.category?.trim() ||
        catalog.categoria,
      benefit: profileBenefit(profile) || (roster ? rosterBenefit(roster) : null),
      membershipPlan: sub.plan as Socio["membershipPlan"],
      ...coords,
    };
  }

  const logoTrim = profile.logoUrl?.trim() || null;
  const foto = logoTrim
    ? logoTrim.replace(/^\/logos\//, "").replace(/\.png$/i, "")
    : slugFromName(name);

  return {
    id: socioId,
    name,
    categoria:
      profile.category?.trim() ||
      roster?.category?.trim() ||
      "Negocio certificado",
    foto,
    url: profile.website?.trim() || overrideUrl || "#",
    direccion: mapsLinkFrom(profile.googleBusinessUrl),
    benefit: profileBenefit(profile) || (roster ? rosterBenefit(roster) : null),
    membershipPlan: sub.plan as Socio["membershipPlan"],
    latitude: profile.latitude ?? null,
    longitude: profile.longitude ?? null,
    logoUrl: logoTrim,
  };
}

/** Prefer linked user overlay, then catalog roster; drop name duplicates. */
function dedupeByName(socios: Socio[]): Socio[] {
  const rank = (s: Socio) => {
    if (!isSyntheticSocioId(s.id) && (s.logoUrl || s.benefit)) return 0;
    if (!isSyntheticSocioId(s.id)) return 1;
    return 2;
  };
  const best: Socio[] = [];
  for (const socio of socios) {
    if (!normalizeName(socio.name)) continue;
    const idx = best.findIndex((prev) => namesReferToSameBusiness(prev.name, socio.name));
    if (idx < 0) {
      best.push(socio);
      continue;
    }
    if (rank(socio) < rank(best[idx]!)) best[idx] = socio;
  }
  return best;
}

/**
 * Quita instrucciones de canje del payload al cliente.
 * Título/descripción siguen como gancho de membresía; howToRedeem solo a pagados.
 */
export function redactSociosRedeemDetails(
  socios: Socio[],
  includeRedeemDetails: boolean
): Socio[] {
  if (includeRedeemDetails) return socios;
  return socios.map((socio) => {
    if (!socio.benefit) return socio;
    return {
      ...socio,
      benefit: {
        ...socio.benefit,
        howToRedeem: "",
      },
    };
  });
}

async function fetchPublicSociosList(): Promise<Socio[]> {
  const [publishedUsers, websiteOverrides, memberships] = await Promise.all([
    loadPublishedBusinessUsers(),
    loadCatalogWebsiteOverrides(),
    loadActiveCatalogMemberships(),
  ]);

  const socioIds = [...memberships.keys()];
  const businessRows =
    socioIds.length > 0
      ? await prisma.business.findMany({
          where: { id: { in: socioIds } },
          select: {
            id: true,
            website: true,
            mapsUrl: true,
            latitude: true,
            longitude: true,
          },
        })
      : [];
  const businesses = new Map(
    businessRows.map((b) => [
      b.id,
      {
        website: b.website,
        mapsUrl: b.mapsUrl,
        latitude: b.latitude,
        longitude: b.longitude,
      },
    ])
  );

  const fromRoster: Socio[] = [];
  for (const [socioId, membership] of memberships) {
    const entry = catalogSocioFromRoster(socioId, membership, websiteOverrides, businesses);
    if (entry) fromRoster.push(entry);
  }

  const fromUsers = publishedUsers
    .map((user) => userToSocio(user, websiteOverrides, memberships))
    .filter(Boolean) as Socio[];

  const byId = new Map<number, Socio>();
  for (const socio of fromRoster) byId.set(socio.id, socio);
  for (const socio of fromUsers) {
    byId.set(socio.id, socio);
  }

  return dedupeByName([...byId.values()]).sort(compareSociosByPlan);
}

/** Socios visibles en /cuponera: solo membresía de negocio activa (roster o usuario). */
export const getPublicSociosList = unstable_cache(
  fetchPublicSociosList,
  ["public-socios-list-v2"],
  { revalidate: 120, tags: [PUBLIC_SOCIOS_TAG] }
);

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

/** Active catalog socioIds with GRAN_EMPRESA (for MAPA). */
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
