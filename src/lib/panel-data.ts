import type { MembershipPlan } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { MEMBERSHIP_PLANS } from "@/lib/membresia";

export type SafePanelSubscription = {
  plan: MembershipPlan;
  status: string;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  createdAt: string | null;
};

export type SafeSocioProfile = {
  id: string;
  businessName: string;
  website: string;
  googleBusinessUrl: string;
  logoUrl: string;
  linkageStatus: string;
  isManualEntry: boolean;
  address: string;
  latitude: number | null;
  longitude: number | null;
  category: string;
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  usoCfdi: string;
  billingStreet: string;
  billingColonia: string;
  billingCiudad: string;
  billingEstado: string;
  billingPais: string;
  billingCodigoPostal: string;
  billingAddressFull: string;
  offersBenefit: boolean;
  benefitTitle: string;
  benefitDescription: string;
  benefitHowToRedeem: string;
  benefitRedeemViaQr: boolean;
  benefitValidFrom: string | null;
  benefitValidUntil: string | null;
};

export const DEFAULT_PANEL_SUBSCRIPTION: SafePanelSubscription = {
  plan: "TURISTA",
  status: "inactive",
  currentPeriodEnd: null,
  stripeSubscriptionId: null,
  stripeCustomerId: null,
  createdAt: null,
};

function isMembershipPlan(value: unknown): value is MembershipPlan {
  return typeof value === "string" && value in MEMBERSHIP_PLANS;
}

export function normalizePanelSubscription(
  sub?: {
    plan?: MembershipPlan | null;
    status?: string | null;
    currentPeriodEnd?: Date | string | null;
    stripeSubscriptionId?: string | null;
    stripeCustomerId?: string | null;
    createdAt?: Date | string | null;
  } | null
): SafePanelSubscription {
  if (!sub) return { ...DEFAULT_PANEL_SUBSCRIPTION };

  let currentPeriodEnd: string | null = null;
  if (sub.currentPeriodEnd) {
    const d =
      sub.currentPeriodEnd instanceof Date
        ? sub.currentPeriodEnd
        : new Date(sub.currentPeriodEnd);
    currentPeriodEnd = Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  let createdAt: string | null = null;
  if (sub.createdAt) {
    const d = sub.createdAt instanceof Date ? sub.createdAt : new Date(sub.createdAt);
    createdAt = Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  return {
    plan: isMembershipPlan(sub.plan) ? sub.plan : "TURISTA",
    status: typeof sub.status === "string" && sub.status.trim() ? sub.status : "inactive",
    currentPeriodEnd,
    stripeSubscriptionId: sub.stripeSubscriptionId ?? null,
    stripeCustomerId: sub.stripeCustomerId ?? null,
    createdAt,
  };
}

export function normalizeSocioProfile(
  profile?: {
    id?: string | null;
    businessName?: string | null;
    website?: string | null;
    googleBusinessUrl?: string | null;
    logoUrl?: string | null;
    linkageStatus?: string | null;
    isManualEntry?: boolean | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    category?: string | null;
    rfc?: string | null;
    razonSocial?: string | null;
    regimenFiscal?: string | null;
    usoCfdi?: string | null;
    billingStreet?: string | null;
    billingColonia?: string | null;
    billingCiudad?: string | null;
    billingEstado?: string | null;
    billingPais?: string | null;
    billingCodigoPostal?: string | null;
    billingAddressFull?: string | null;
    offersBenefit?: boolean | null;
    benefitTitle?: string | null;
    benefitDescription?: string | null;
    benefitHowToRedeem?: string | null;
    benefitRedeemViaQr?: boolean | null;
    benefitValidFrom?: Date | string | null;
    benefitValidUntil?: Date | string | null;
  } | null
): SafeSocioProfile | null {
  if (!profile) return null;

  const toIso = (value?: Date | string | null): string | null => {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  return {
    id: profile.id?.trim() ?? "",
    businessName: profile.businessName?.trim() ?? "",
    website: profile.website?.trim() ?? "",
    googleBusinessUrl: profile.googleBusinessUrl?.trim() ?? "",
    logoUrl: profile.logoUrl?.trim() ?? "",
    linkageStatus: profile.linkageStatus?.trim() ?? "",
    isManualEntry: Boolean(profile.isManualEntry),
    address: profile.address?.trim() ?? "",
    latitude: profile.latitude ?? null,
    longitude: profile.longitude ?? null,
    category: profile.category?.trim() ?? "",
    rfc: profile.rfc?.trim() ?? "",
    razonSocial: profile.razonSocial?.trim() ?? "",
    regimenFiscal: profile.regimenFiscal?.trim() ?? "",
    usoCfdi: profile.usoCfdi?.trim() ?? "",
    billingStreet: profile.billingStreet?.trim() ?? "",
    billingColonia: profile.billingColonia?.trim() ?? "",
    billingCiudad: profile.billingCiudad?.trim() ?? "",
    billingEstado: profile.billingEstado?.trim() ?? "",
    billingPais: profile.billingPais?.trim() ?? "México",
    billingCodigoPostal: profile.billingCodigoPostal?.trim() ?? "",
    billingAddressFull: profile.billingAddressFull?.trim() ?? "",
    offersBenefit: Boolean(profile.offersBenefit),
    benefitTitle: profile.benefitTitle?.trim() ?? "",
    benefitDescription: profile.benefitDescription?.trim() ?? "",
    benefitHowToRedeem: profile.benefitHowToRedeem?.trim() ?? "",
    benefitRedeemViaQr: Boolean(profile.benefitRedeemViaQr),
    benefitValidFrom: toIso(profile.benefitValidFrom),
    benefitValidUntil: toIso(profile.benefitValidUntil),
  };
}

/** Carga usuario + suscripción; socioProfile es opcional si la tabla aún no existe en Neon. */
export async function loadPanelUser(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true, socioProfile: true },
    });
  } catch (error) {
    console.error("[panel] load with socioProfile failed, retrying without:", error);
    return prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
  }
}

export async function loadTakenSocioIds(excludeUserId: string): Promise<number[]> {
  try {
    const rows = await prisma.user.findMany({
      where: { socioId: { not: null }, NOT: { id: excludeUserId } },
      select: { socioId: true },
    });
    return rows.map((r) => r.socioId).filter((id): id is number => typeof id === "number");
  } catch (error) {
    console.error("[panel] loadTakenSocioIds failed:", error);
    return [];
  }
}

/** Elimina perfil huérfano solo si no hay negocio en curso de registro. */
export async function cleanupOrphanSocioProfile(userId: string, socioId: number | null): Promise<void> {
  if (socioId != null) return;
  try {
    const profile = await prisma.socioProfile.findUnique({ where: { userId } });
    if (!profile) return;
    // Nunca borrar si ya hay nombre comercial (manual o vinculado en revisión).
    if (profile.businessName?.trim()) return;
    if (profile.linkageStatus === "pending") return;
    if (profile.linkageStatus === "approved") return;
    await prisma.socioProfile.delete({ where: { userId } });
  } catch (error) {
    console.error("[panel] cleanupOrphanSocioProfile failed:", error);
  }
}
