"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-utils";
import { isAdminUser } from "@/lib/admin";
import { listaSocios } from "@/app/data/socios";
import { getPlanLabel, isBusinessPlan } from "@/lib/membresia";
import { advanceBillingAnniversary } from "@/lib/subscription-lifecycle";
import { publishBusinessPresenceOnPayment } from "@/lib/publish-business";
import { toSocioProfileDbFields } from "@/lib/business-profile-payload";
import { emptyBusinessProfile } from "@/lib/business-address";
import type { SocioProfileFormInitial } from "@/app/panel/business-profile-types";
import type { MembershipPlan } from "@/generated/prisma/client";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function approveManualCertification(userId: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) {
      return { ok: false, error: "No autorizado." };
    }

    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) {
      return { ok: false, error: "El usuario no tiene suscripción." };
    }

    await prisma.subscription.update({
      where: { userId },
      data: {
        status: "manual_active",
        currentPeriodEnd: advanceBillingAnniversary(subscription.currentPeriodEnd),
        ...(subscription.paymentMethod ? {} : { paymentMethod: "transfer" }),
      },
    });

    await publishBusinessPresenceOnPayment(userId, subscription.plan, {
      reinstateRoster: true,
    });

    revalidatePath("/admin");
    revalidatePath("/panel");
    revalidatePath("/socios");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo aprobar la certificación." };
  }
}

export async function rejectManualCertification(userId: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) {
      return { ok: false, error: "No autorizado." };
    }

    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) {
      return { ok: false, error: "El usuario no tiene suscripción." };
    }

    await prisma.subscription.update({
      where: { userId },
      data: {
        status: "manual_rejected",
        currentPeriodEnd: null,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/panel");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo rechazar la certificación." };
  }
}

const adminUpdateSchema = z.object({
  userId: z.string().min(1),
  nombre: z.string().trim().max(120).optional(),
  socioId: z.number().int().positive().nullable().optional(),
  plan: z.enum(["TURISTA", "VECINO", "NEGOCIO_FAMILIAR", "MEDIANA_EMPRESA", "GRAN_EMPRESA"]).optional(),
  status: z.string().trim().max(40).optional(),
  paymentMethod: z.enum(["stripe", "transfer", "cash", "oxxo"]).nullable().optional(),
  businessName: z.string().trim().max(120).optional(),
  website: z.string().trim().max(500).optional(),
  googleBusinessUrl: z.string().trim().max(500).optional(),
  logoUrl: z.string().trim().max(500).optional(),
  rfc: z.string().trim().max(13).optional(),
  razonSocial: z.string().trim().max(200).optional(),
  regimenFiscal: z.string().trim().max(120).optional(),
  usoCfdi: z.string().trim().max(80).optional(),
  billingAddressFull: z.string().trim().max(400).optional(),
  billingStreet: z.string().trim().max(200).optional(),
  billingColonia: z.string().trim().max(120).optional(),
  billingCiudad: z.string().trim().max(120).optional(),
  billingEstado: z.string().trim().max(80).optional(),
  billingPais: z.string().trim().max(80).optional(),
  billingCodigoPostal: z.string().trim().max(10).optional(),
  address: z.string().trim().max(300).optional(),
  category: z.string().trim().max(120).optional(),
  role: z.enum(["SOCIO", "ADMIN"]).optional(),
});

export async function updateSocioAdmin(input: z.infer<typeof adminUpdateSchema>): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) {
      return { ok: false, error: "No autorizado." };
    }

    const parsed = adminUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const {
      userId,
      nombre,
      socioId,
      plan,
      status,
      paymentMethod,
      businessName,
      website,
      googleBusinessUrl,
      logoUrl,
      rfc,
      razonSocial,
      regimenFiscal,
      usoCfdi,
      billingAddressFull,
      billingStreet,
      billingColonia,
      billingCiudad,
      billingEstado,
      billingPais,
      billingCodigoPostal,
      address,
      category,
      role,
    } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { ok: false, error: "Usuario no encontrado." };

    if (socioId !== undefined && socioId !== null) {
      const socio = listaSocios.find((s) => s.id === socioId);
      const roster = await prisma.catalogMembership.findUnique({
        where: { socioId },
        select: { socioId: true },
      });
      if (!socio && !roster) {
        return { ok: false, error: "Negocio no existe en el catálogo ni en el roster." };
      }
      const taken = await prisma.user.findFirst({
        where: { socioId, NOT: { id: userId } },
      });
      if (taken) return { ok: false, error: "Ese negocio ya está vinculado a otra cuenta." };
    }

    if (role !== undefined && session.id === userId && role === "SOCIO") {
      return { ok: false, error: "No puedes quitarte permisos de administrador." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nombre !== undefined ? { nombre } : {}),
        ...(socioId !== undefined ? { socioId } : {}),
        ...(role !== undefined ? { role } : {}),
      },
    });

    if (plan !== undefined || status !== undefined || paymentMethod !== undefined) {
      const existingSub = await prisma.subscription.findUnique({ where: { userId } });
      const nextPeriodEnd =
        status === "manual_active"
          ? advanceBillingAnniversary(existingSub?.currentPeriodEnd)
          : undefined;

      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan: plan ?? "TURISTA",
          status: status ?? "inactive",
          ...(paymentMethod !== undefined ? { paymentMethod } : {}),
          ...(nextPeriodEnd ? { currentPeriodEnd: nextPeriodEnd } : {}),
        },
        update: {
          ...(plan !== undefined ? { plan } : {}),
          ...(paymentMethod !== undefined ? { paymentMethod } : {}),
          ...(status !== undefined
            ? {
                status,
                ...(nextPeriodEnd ? { currentPeriodEnd: nextPeriodEnd } : {}),
              }
            : {}),
        },
      });

      const subAfter = await prisma.subscription.findUnique({ where: { userId } });
      if (
        subAfter &&
        (subAfter.status === "active" || subAfter.status === "manual_active")
      ) {
        await publishBusinessPresenceOnPayment(userId, subAfter.plan, {
          reinstateRoster: status === "manual_active" || status === "active",
        });
      }
    }

    if (
      businessName !== undefined ||
      website !== undefined ||
      googleBusinessUrl !== undefined ||
      logoUrl !== undefined ||
      address !== undefined ||
      category !== undefined ||
      rfc !== undefined ||
      razonSocial !== undefined ||
      regimenFiscal !== undefined ||
      usoCfdi !== undefined ||
      billingAddressFull !== undefined ||
      billingStreet !== undefined ||
      billingColonia !== undefined ||
      billingCiudad !== undefined ||
      billingEstado !== undefined ||
      billingPais !== undefined ||
      billingCodigoPostal !== undefined
    ) {
      await prisma.socioProfile.upsert({
        where: { userId },
        create: {
          userId,
          businessName: businessName ?? null,
          website: website ?? null,
          googleBusinessUrl: googleBusinessUrl ?? null,
          logoUrl: logoUrl ?? null,
          address: address ?? null,
          category: category ?? null,
          rfc: rfc ?? null,
          razonSocial: razonSocial ?? null,
          regimenFiscal: regimenFiscal ?? null,
          usoCfdi: usoCfdi ?? null,
          billingAddressFull: billingAddressFull ?? null,
          billingStreet: billingStreet ?? null,
          billingColonia: billingColonia ?? null,
          billingCiudad: billingCiudad ?? null,
          billingEstado: billingEstado ?? null,
          billingPais: billingPais ?? null,
          billingCodigoPostal: billingCodigoPostal ?? null,
        },
        update: {
          ...(businessName !== undefined ? { businessName } : {}),
          ...(website !== undefined ? { website } : {}),
          ...(googleBusinessUrl !== undefined ? { googleBusinessUrl } : {}),
          ...(logoUrl !== undefined ? { logoUrl } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(category !== undefined ? { category } : {}),
          ...(rfc !== undefined ? { rfc } : {}),
          ...(razonSocial !== undefined ? { razonSocial } : {}),
          ...(regimenFiscal !== undefined ? { regimenFiscal } : {}),
          ...(usoCfdi !== undefined ? { usoCfdi } : {}),
          ...(billingAddressFull !== undefined ? { billingAddressFull } : {}),
          ...(billingStreet !== undefined ? { billingStreet } : {}),
          ...(billingColonia !== undefined ? { billingColonia } : {}),
          ...(billingCiudad !== undefined ? { billingCiudad } : {}),
          ...(billingEstado !== undefined ? { billingEstado } : {}),
          ...(billingPais !== undefined ? { billingPais } : {}),
          ...(billingCodigoPostal !== undefined ? { billingCodigoPostal } : {}),
        },
      });

      const linkedSocioId =
        socioId !== undefined ? socioId : user.socioId;
      if (
        linkedSocioId != null &&
        (businessName !== undefined || category !== undefined)
      ) {
        await prisma.catalogMembership.updateMany({
          where: { socioId: linkedSocioId },
          data: {
            ...(businessName !== undefined ? { businessName } : {}),
            ...(category !== undefined ? { category } : {}),
          },
        });
      }
    }

    revalidatePath("/admin");
    revalidatePath("/panel");
    revalidatePath("/socios");
    revalidatePath("/map");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo actualizar el socio." };
  }
}

export async function deleteSocioUser(userId: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) {
      return { ok: false, error: "No autorizado." };
    }
    if (session.id === userId) {
      return { ok: false, error: "No puedes eliminar tu propia cuenta de administrador." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        socioId: true,
        socioProfile: { select: { businessName: true } },
      },
    });

    await prisma.$transaction(async (tx) => {
      if (user?.socioId != null) {
        await tx.catalogSocioOverride.deleteMany({ where: { socioId: user.socioId } });
        await tx.catalogMembership.deleteMany({ where: { socioId: user.socioId } });
      } else {
        const name = user?.socioProfile?.businessName?.trim();
        if (name) {
          const orphans = await tx.catalogMembership.findMany({
            where: { businessName: name },
            select: { socioId: true },
          });
          for (const row of orphans) {
            const stillLinked = await tx.user.findFirst({
              where: { socioId: row.socioId, NOT: { id: userId } },
              select: { id: true },
            });
            if (stillLinked) continue;
            await tx.catalogSocioOverride.deleteMany({ where: { socioId: row.socioId } });
            await tx.catalogMembership.delete({ where: { socioId: row.socioId } });
          }
        }
      }
      await tx.user.delete({ where: { id: userId } });
    });

    revalidatePath("/admin");
    revalidatePath("/panel");
    revalidatePath("/socios");
    revalidatePath("/pasaporte");
    revalidatePath("/map");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo eliminar el socio." };
  }
}

export type AdminUserRow = {
  id: string;
  nombre: string;
  email: string;
  socioId: number | null;
  role: "SOCIO" | "ADMIN";
  socioName: string | null;
  plan: MembershipPlan;
  planLabel: string;
  status: string;
  createdAt: string;
  currentPeriodEnd: string | null;
  subscriptionCreatedAt: string | null;
  paymentMethod: string | null;
  manualPaymentNote: string | null;
  stripeSubscriptionId: string | null;
  linkageStatus: string | null;
  isManualEntry: boolean;
  profile: {
    businessName: string;
    website: string;
    googleBusinessUrl: string;
    logoUrl: string;
    address: string;
    street: string;
    streetNumber: string;
    colonia: string;
    codigoPostal: string;
    municipio: string;
    estado: string;
    pais: string;
    phone: string;
    latitude: number | null;
    longitude: number | null;
    category: string;
    contactFirstName: string;
    contactLastNamePaternal: string;
    contactLastNameMaternal: string;
    contactRole: string;
    contactBirthDate: string;
    contactWhatsapp: string;
    contactEmail: string;
    rfc: string;
    razonSocial: string;
    personaTipo: string;
    regimenFiscal: string;
    usoCfdi: string;
    billingStreet: string;
    billingStreetNumber: string;
    billingColonia: string;
    billingCiudad: string;
    billingMunicipio: string;
    billingEstado: string;
    billingPais: string;
    billingCodigoPostal: string;
    billingAddressFull: string;
    billingWhatsapp: string;
    billingEmail: string;
    billingSameWhatsapp: boolean;
    billingSameEmail: boolean;
    billingSameAddress: boolean;
    privacyAccepted: boolean;
  } | null;
  requestedBusinessName: string | null;
};

export async function approveLinkage(userId: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) {
      return { ok: false, error: "No autorizado." };
    }

    const profile = await prisma.socioProfile.findUnique({ where: { userId } });
    if (!profile) {
      return { ok: false, error: "El usuario no tiene solicitud de vinculación." };
    }

    await prisma.socioProfile.update({
      where: { userId },
      data: { linkageStatus: "approved" },
    });

    revalidatePath("/admin");
    revalidatePath("/panel");
    revalidatePath("/socios");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo aprobar la vinculación." };
  }
}

export async function rejectLinkage(userId: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) {
      return { ok: false, error: "No autorizado." };
    }

    await prisma.socioProfile.updateMany({
      where: { userId },
      data: { linkageStatus: "rejected" },
    });

    revalidatePath("/admin");
    revalidatePath("/panel");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo rechazar la vinculación." };
  }
}

const BASE_SOCIO_PROFILE_SELECT = {
  businessName: true,
  website: true,
  googleBusinessUrl: true,
  logoUrl: true,
} as const;

const EXTENDED_BILLING_SELECT = {
  rfc: true,
  razonSocial: true,
  personaTipo: true,
  regimenFiscal: true,
  usoCfdi: true,
  billingStreet: true,
  billingStreetNumber: true,
  billingColonia: true,
  billingCiudad: true,
  billingMunicipio: true,
  billingEstado: true,
  billingPais: true,
  billingCodigoPostal: true,
  billingAddressFull: true,
  billingWhatsapp: true,
  billingEmail: true,
  billingSameWhatsapp: true,
  billingSameEmail: true,
  billingSameAddress: true,
  privacyAcceptedAt: true,
} as const;

const EXTENDED_SOCIO_PROFILE_SELECT = {
  ...BASE_SOCIO_PROFILE_SELECT,
  linkageStatus: true,
  isManualEntry: true,
  address: true,
  street: true,
  streetNumber: true,
  colonia: true,
  codigoPostal: true,
  municipio: true,
  estado: true,
  pais: true,
  phone: true,
  latitude: true,
  longitude: true,
  category: true,
  contactFirstName: true,
  contactLastNamePaternal: true,
  contactLastNameMaternal: true,
  contactRole: true,
  contactBirthDate: true,
  contactWhatsapp: true,
  contactEmail: true,
  ...EXTENDED_BILLING_SELECT,
} as const;

const SUBSCRIPTION_ADMIN_SELECT = {
  plan: true,
  status: true,
  currentPeriodEnd: true,
  manualPaymentNote: true,
  stripeSubscriptionId: true,
  paymentMethod: true,
  createdAt: true,
} as const;

const USER_ADMIN_BASE_SELECT = {
  id: true,
  email: true,
  nombre: true,
  socioId: true,
  role: true,
  createdAt: true,
  subscription: { select: SUBSCRIPTION_ADMIN_SELECT },
} as const;

type AdminUserRecord = {
  id: string;
  email: string | null;
  nombre: string | null;
  socioId: number | null;
  role: "SOCIO" | "ADMIN";
  createdAt: Date;
  subscription: {
    plan: MembershipPlan;
    status: string;
    currentPeriodEnd: Date | null;
    manualPaymentNote: string | null;
    stripeSubscriptionId: string | null;
    paymentMethod: string | null;
    createdAt: Date;
  } | null;
  socioProfile?: {
    businessName: string | null;
    website: string | null;
    googleBusinessUrl: string | null;
    logoUrl: string | null;
    linkageStatus?: string | null;
    isManualEntry?: boolean | null;
    address?: string | null;
    street?: string | null;
    streetNumber?: string | null;
    colonia?: string | null;
    codigoPostal?: string | null;
    municipio?: string | null;
    estado?: string | null;
    pais?: string | null;
    phone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    category?: string | null;
    contactFirstName?: string | null;
    contactLastNamePaternal?: string | null;
    contactLastNameMaternal?: string | null;
    contactRole?: string | null;
    contactBirthDate?: Date | string | null;
    contactWhatsapp?: string | null;
    contactEmail?: string | null;
    rfc?: string | null;
    razonSocial?: string | null;
    personaTipo?: string | null;
    regimenFiscal?: string | null;
    usoCfdi?: string | null;
    billingStreet?: string | null;
    billingStreetNumber?: string | null;
    billingColonia?: string | null;
    billingCiudad?: string | null;
    billingMunicipio?: string | null;
    billingEstado?: string | null;
    billingPais?: string | null;
    billingCodigoPostal?: string | null;
    billingAddressFull?: string | null;
    billingWhatsapp?: string | null;
    billingEmail?: string | null;
    billingSameWhatsapp?: boolean | null;
    billingSameEmail?: boolean | null;
    billingSameAddress?: boolean | null;
    privacyAcceptedAt?: Date | string | null;
  } | null;
};

async function fetchAdminUserRecords(): Promise<AdminUserRecord[]> {
  try {
    return (await prisma.user.findMany({
      select: {
        ...USER_ADMIN_BASE_SELECT,
        socioProfile: { select: EXTENDED_SOCIO_PROFILE_SELECT },
      },
      orderBy: { createdAt: "desc" },
    })) as AdminUserRecord[];
  } catch (error) {
    console.error("[admin] load with extended socioProfile failed, retrying base profile:", error);
  }

  try {
    return (await prisma.user.findMany({
      select: {
        ...USER_ADMIN_BASE_SELECT,
        socioProfile: { select: BASE_SOCIO_PROFILE_SELECT },
      },
      orderBy: { createdAt: "desc" },
    })) as AdminUserRecord[];
  } catch (error) {
    console.error("[admin] load with socioProfile failed, retrying without profile:", error);
  }

  return (await prisma.user.findMany({
    select: USER_ADMIN_BASE_SELECT,
    orderBy: { createdAt: "desc" },
  })) as AdminUserRecord[];
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const session = await requireSession();
  if (!isAdminUser(session)) {
    throw new Error("FORBIDDEN");
  }

  const users = await fetchAdminUserRecords();

  return users.map((user) => {
    const catalogSocio = user.socioId ? listaSocios.find((s) => s.id === user.socioId) : null;
    const businessName = user.socioProfile?.businessName ?? catalogSocio?.name ?? null;
    const plan = user.subscription?.plan ?? "TURISTA";

    const requestedBusinessName =
      user.socioProfile?.businessName?.trim() || catalogSocio?.name || null;

    return {
      id: user.id,
      nombre: user.nombre ?? user.email ?? "—",
      email: user.email ?? "—",
      socioId: user.socioId,
      role: user.role,
      socioName: businessName,
      requestedBusinessName,
      plan,
      planLabel: getPlanLabel(plan),
      status: user.subscription?.status ?? "inactive",
      createdAt: user.createdAt.toISOString(),
      currentPeriodEnd: user.subscription?.currentPeriodEnd?.toISOString() ?? null,
      subscriptionCreatedAt: user.subscription?.createdAt?.toISOString() ?? null,
      paymentMethod: user.subscription?.paymentMethod ?? null,
      manualPaymentNote: user.subscription?.manualPaymentNote ?? null,
      stripeSubscriptionId: user.subscription?.stripeSubscriptionId ?? null,
      linkageStatus: user.socioProfile?.linkageStatus ?? null,
      isManualEntry: user.socioProfile?.isManualEntry ?? false,
      profile: user.socioProfile
        ? {
            businessName: user.socioProfile.businessName ?? "",
            website: user.socioProfile.website ?? "",
            googleBusinessUrl: user.socioProfile.googleBusinessUrl ?? "",
            logoUrl: user.socioProfile.logoUrl ?? "",
            address: user.socioProfile.address ?? "",
            street: user.socioProfile.street ?? "",
            streetNumber: user.socioProfile.streetNumber ?? "",
            colonia: user.socioProfile.colonia ?? "",
            codigoPostal: user.socioProfile.codigoPostal ?? "",
            municipio: user.socioProfile.municipio ?? "",
            estado: user.socioProfile.estado ?? "",
            pais: user.socioProfile.pais ?? "México",
            phone: user.socioProfile.phone ?? "",
            latitude: user.socioProfile.latitude ?? null,
            longitude: user.socioProfile.longitude ?? null,
            category: user.socioProfile.category ?? "",
            contactFirstName: user.socioProfile.contactFirstName ?? "",
            contactLastNamePaternal: user.socioProfile.contactLastNamePaternal ?? "",
            contactLastNameMaternal: user.socioProfile.contactLastNameMaternal ?? "",
            contactRole: user.socioProfile.contactRole ?? "",
            contactBirthDate: (() => {
              const v = user.socioProfile.contactBirthDate;
              if (!v) return "";
              const d = v instanceof Date ? v : new Date(v);
              return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
            })(),
            contactWhatsapp: user.socioProfile.contactWhatsapp ?? "",
            contactEmail: user.socioProfile.contactEmail ?? "",
            rfc: user.socioProfile.rfc ?? "",
            razonSocial: user.socioProfile.razonSocial ?? "",
            personaTipo: user.socioProfile.personaTipo ?? "",
            regimenFiscal: user.socioProfile.regimenFiscal ?? "",
            usoCfdi: user.socioProfile.usoCfdi ?? "",
            billingStreet: user.socioProfile.billingStreet ?? "",
            billingStreetNumber: user.socioProfile.billingStreetNumber ?? "",
            billingColonia: user.socioProfile.billingColonia ?? "",
            billingCiudad: user.socioProfile.billingCiudad ?? "",
            billingMunicipio:
              user.socioProfile.billingMunicipio ?? user.socioProfile.billingCiudad ?? "",
            billingEstado: user.socioProfile.billingEstado ?? "",
            billingPais: user.socioProfile.billingPais ?? "México",
            billingCodigoPostal: user.socioProfile.billingCodigoPostal ?? "",
            billingAddressFull: user.socioProfile.billingAddressFull ?? "",
            billingWhatsapp: user.socioProfile.billingWhatsapp ?? "",
            billingEmail: user.socioProfile.billingEmail ?? "",
            billingSameWhatsapp: user.socioProfile.billingSameWhatsapp ?? true,
            billingSameEmail: user.socioProfile.billingSameEmail ?? true,
            billingSameAddress: user.socioProfile.billingSameAddress ?? true,
            privacyAccepted: Boolean(user.socioProfile.privacyAcceptedAt),
          }
        : null,
    };
  });
}

export async function listTakenSocioIds(): Promise<number[]> {
  const rows = await prisma.user.findMany({
    where: { socioId: { not: null } },
    select: { socioId: true },
  });
  return rows.map((r) => r.socioId!).filter(Boolean);
}

// ======================
// TESTIMONIALS
// ======================

export type TestimonialRow = {
  id: string;
  authorName: string;
  businessName: string;
  planTier: string;
  quote: string;
  photoUrl: string | null;
  published: boolean;
  order: number;
  createdAt: string;
};

const testimonialSchema = z.object({
  authorName: z.string().trim().min(1).max(120),
  businessName: z.string().trim().min(1).max(120),
  planTier: z.string().trim().min(1).max(60),
  quote: z.string().trim().min(1).max(1000),
  photoUrl: z.string().trim().max(500).nullable().optional(),
  published: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export async function listTestimonials(): Promise<TestimonialRow[]> {
  const session = await requireSession();
  if (!isAdminUser(session)) throw new Error("FORBIDDEN");

  const rows = await prisma.testimonial.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function createTestimonial(
  input: z.infer<typeof testimonialSchema>
): Promise<ActionResult & { id?: string }> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return { ok: false, error: "No autorizado." };

    const parsed = testimonialSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const row = await prisma.testimonial.create({ data: parsed.data });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, id: row.id };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo crear el testimonio." };
  }
}

export async function updateTestimonial(
  id: string,
  input: z.infer<typeof testimonialSchema>
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return { ok: false, error: "No autorizado." };

    const parsed = testimonialSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    await prisma.testimonial.update({ where: { id }, data: parsed.data });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo actualizar el testimonio." };
  }
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return { ok: false, error: "No autorizado." };

    await prisma.testimonial.delete({ where: { id } });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo eliminar el testimonio." };
  }
}

export async function toggleTestimonialPublished(id: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return { ok: false, error: "No autorizado." };

    const row = await prisma.testimonial.findUnique({ where: { id } });
    if (!row) return { ok: false, error: "Testimonio no encontrado." };

    await prisma.testimonial.update({
      where: { id },
      data: { published: !row.published },
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo cambiar el estado." };
  }
}

// ======================
// HOME PROMOS
// ======================

export type HomePromoRow = {
  id: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

const homePromoSchema = z.object({
  headline: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(2000),
  ctaLabel: z.string().trim().min(1).max(80),
  ctaHref: z.string().trim().min(1).max(500),
  active: z.boolean().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
});

export async function listHomePromos(): Promise<HomePromoRow[]> {
  const session = await requireSession();
  if (!isAdminUser(session)) throw new Error("FORBIDDEN");

  const rows = await prisma.homePromo.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((r) => ({
    ...r,
    startsAt: r.startsAt?.toISOString() ?? null,
    endsAt: r.endsAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function createHomePromo(
  input: z.infer<typeof homePromoSchema>
): Promise<ActionResult & { id?: string }> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return { ok: false, error: "No autorizado." };

    const parsed = homePromoSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const { startsAt, endsAt, ...rest } = parsed.data;
    const row = await prisma.homePromo.create({
      data: {
        ...rest,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, id: row.id };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo crear la promoción." };
  }
}

export async function updateHomePromo(
  id: string,
  input: z.infer<typeof homePromoSchema>
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return { ok: false, error: "No autorizado." };

    const parsed = homePromoSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const { startsAt, endsAt, ...rest } = parsed.data;
    await prisma.homePromo.update({
      where: { id },
      data: {
        ...rest,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo actualizar la promoción." };
  }
}

export async function deleteHomePromo(id: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return { ok: false, error: "No autorizado." };

    await prisma.homePromo.delete({ where: { id } });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo eliminar la promoción." };
  }
}

export async function toggleHomePromoActive(id: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return { ok: false, error: "No autorizado." };

    const row = await prisma.homePromo.findUnique({ where: { id } });
    if (!row) return { ok: false, error: "Promoción no encontrada." };

    await prisma.homePromo.update({
      where: { id },
      data: { active: !row.active },
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo cambiar el estado." };
  }
}

export type CatalogSocioRow = {
  id: number;
  name: string;
  categoria: string;
  catalogUrl: string;
  website: string;
  hasOverride: boolean;
};

export async function listCatalogSocioRows(): Promise<CatalogSocioRow[]> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return [];

    const overrides = await prisma.catalogSocioOverride.findMany({
      select: { socioId: true, website: true },
    });
    const byId = new Map(
      overrides.map((row) => [row.socioId, row.website?.trim() || null] as const)
    );

    return listaSocios
      .map((s) => {
        const override = byId.get(s.id);
        const hasOverride = Boolean(override);
        return {
          id: s.id,
          name: s.name,
          categoria: s.categoria,
          catalogUrl: s.url,
          website: override || s.url,
          hasOverride,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  } catch (error) {
    console.error("[admin] listCatalogSocioRows failed:", error);
    return [];
  }
}

const catalogWebsiteSchema = z.object({
  socioId: z.number().int().positive(),
  website: z.string().trim().max(500),
});

export type CatalogMembershipRow = {
  socioId: number;
  businessName: string;
  plan: MembershipPlan;
  planLabel: string;
  paymentMethod: string | null;
  paymentLabel: string;
  status: string;
  currentPeriodEnd: string | null;
  monthsPastDue: number;
  foto: string;
  categoria: string;
  offersBenefit: boolean;
  benefitTitle: string;
  benefitDescription: string;
  benefitHowToRedeem: string;
  benefitRedeemViaQr: boolean;
  benefitValidFrom: string;
  benefitValidUntil: string;
};

function paymentMethodLabel(method: string | null): string {
  switch (method) {
    case "transfer":
      return "Transferencia";
    case "cash":
      return "Efectivo";
    case "stripe":
      return "Stripe";
    case "oxxo":
      return "OXXO";
    default:
      return method?.trim() || "—";
  }
}

export async function listCatalogMemberships(): Promise<CatalogMembershipRow[]> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return [];

    const rows = await prisma.catalogMembership.findMany({
      orderBy: { businessName: "asc" },
    });

    const linkedProfiles = await prisma.user.findMany({
      where: { socioId: { in: rows.map((r) => r.socioId) } },
      select: {
        socioId: true,
        socioProfile: { select: { category: true } },
      },
    });
    const categoryBySocioId = new Map<number, string>();
    for (const u of linkedProfiles) {
      if (u.socioId == null) continue;
      const cat = u.socioProfile?.category?.trim();
      if (cat) categoryBySocioId.set(u.socioId, cat);
    }

    return rows
      .map((row) => {
        const catalog = listaSocios.find((s) => s.id === row.socioId);
        const toDateInput = (d: Date | null) =>
          d ? d.toISOString().slice(0, 10) : "";
        const categoria =
          catalog?.categoria?.trim() ||
          row.category?.trim() ||
          categoryBySocioId.get(row.socioId) ||
          "";
        return {
          socioId: row.socioId,
          businessName: row.businessName?.trim() || catalog?.name || `Socio #${row.socioId}`,
          plan: row.plan,
          planLabel: getPlanLabel(row.plan),
          paymentMethod: row.paymentMethod,
          paymentLabel: paymentMethodLabel(row.paymentMethod),
          status: row.status,
          currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
          monthsPastDue: row.monthsPastDue ?? 0,
          foto: catalog?.foto ?? "",
          categoria,
          offersBenefit: Boolean(row.offersBenefit),
          benefitTitle: row.benefitTitle ?? "",
          benefitDescription: row.benefitDescription ?? "",
          benefitHowToRedeem: row.benefitHowToRedeem ?? "",
          benefitRedeemViaQr: Boolean(row.benefitRedeemViaQr),
          benefitValidFrom: toDateInput(row.benefitValidFrom),
          benefitValidUntil: toDateInput(row.benefitValidUntil),
        };
      })
      .sort((a, b) => a.businessName.localeCompare(b.businessName, "es"));
  } catch (error) {
    console.error("[admin] listCatalogMemberships failed:", error);
    return [];
  }
}

const catalogOpsSchema = z.object({
  socioId: z.number().int().positive(),
  plan: z.enum(["NEGOCIO_FAMILIAR", "MEDIANA_EMPRESA", "GRAN_EMPRESA"]).optional(),
  paymentMethod: z.enum(["stripe", "transfer", "cash", "oxxo"]).nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

/** Activa / renueva membresía del roster (+30 días desde vencimiento), sin exigir cuenta. */
export async function renewCatalogMembership(socioId: number): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return { ok: false, error: "No autorizado." };

    const catalog = listaSocios.find((s) => s.id === socioId);
    const existing = await prisma.catalogMembership.findUnique({ where: { socioId } });
    if (!catalog && !existing) {
      return { ok: false, error: "Socio del catálogo no encontrado." };
    }

    const nextEnd = advanceBillingAnniversary(existing?.currentPeriodEnd);
    const plan =
      existing?.plan && isBusinessPlan(existing.plan) ? existing.plan : "NEGOCIO_FAMILIAR";
    const businessName =
      existing?.businessName?.trim() || catalog?.name || `Socio #${socioId}`;

    await prisma.catalogMembership.upsert({
      where: { socioId },
      create: {
        socioId,
        plan,
        status: "active",
        businessName,
        category: existing?.category ?? catalog?.categoria ?? null,
        paymentMethod: existing?.paymentMethod ?? "transfer",
        currentPeriodEnd: nextEnd,
        monthsPastDue: 0,
      },
      update: {
        status: "active",
        paymentMethod: existing?.paymentMethod ?? "transfer",
        currentPeriodEnd: nextEnd,
        monthsPastDue: 0,
        businessName,
      },
    });

    // Si hay cuenta vinculada, alinear suscripción.
    const linked = await prisma.user.findFirst({
      where: { socioId },
      include: { subscription: true },
    });
    if (linked) {
      await prisma.subscription.upsert({
        where: { userId: linked.id },
        create: {
          userId: linked.id,
          plan,
          status: "manual_active",
          paymentMethod: "transfer",
          currentPeriodEnd: nextEnd,
        },
        update: {
          plan,
          status: "manual_active",
          paymentMethod: linked.subscription?.paymentMethod ?? "transfer",
          currentPeriodEnd: nextEnd,
        },
      });
      await publishBusinessPresenceOnPayment(linked.id, plan, { reinstateRoster: true });
    }

    revalidatePath("/admin");
    revalidatePath("/panel");
    revalidatePath("/socios");
    revalidatePath("/pasaporte");
    revalidatePath("/map");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    console.error("[admin] renewCatalogMembership failed:", error);
    return { ok: false, error: "No se pudo renovar la membresía." };
  }
}

export async function updateCatalogMembershipOps(
  input: z.infer<typeof catalogOpsSchema>
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return { ok: false, error: "No autorizado." };

    const parsed = catalogOpsSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const { socioId, plan, paymentMethod, status } = parsed.data;
    const catalog = listaSocios.find((s) => s.id === socioId);
    const existing = await prisma.catalogMembership.findUnique({ where: { socioId } });
    if (!catalog && !existing) {
      return { ok: false, error: "Socio del catálogo no encontrado." };
    }

    const businessName =
      existing?.businessName?.trim() || catalog?.name || `Socio #${socioId}`;

    await prisma.catalogMembership.upsert({
      where: { socioId },
      create: {
        socioId,
        plan: plan ?? "NEGOCIO_FAMILIAR",
        status: status ?? "active",
        businessName,
        category: existing?.category ?? catalog?.categoria ?? null,
        paymentMethod: paymentMethod ?? null,
        currentPeriodEnd: existing?.currentPeriodEnd ?? null,
      },
      update: {
        ...(plan !== undefined ? { plan } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(paymentMethod !== undefined ? { paymentMethod } : {}),
        businessName,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/socios");
    revalidatePath("/pasaporte");
    revalidatePath("/map");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    console.error("[admin] updateCatalogMembershipOps failed:", error);
    return { ok: false, error: "No se pudo actualizar el negocio." };
  }
}


const catalogBenefitSchema = z.object({
  socioId: z.number().int().positive(),
  offersBenefit: z.boolean(),
  benefitTitle: z.string().trim().max(120),
  benefitDescription: z.string().trim().max(600),
  benefitHowToRedeem: z.string().trim().max(600),
  benefitRedeemViaQr: z.boolean(),
  benefitValidFrom: z.string().trim().optional(),
  benefitValidUntil: z.string().trim().optional(),
});

function parseOptionalBenefitDate(value?: string): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function updateCatalogMembershipBenefit(input: {
  socioId: number;
  offersBenefit: boolean;
  benefitTitle: string;
  benefitDescription: string;
  benefitHowToRedeem: string;
  benefitRedeemViaQr: boolean;
  benefitValidFrom?: string;
  benefitValidUntil?: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return { ok: false, error: "No autorizado." };

    const parsed = catalogBenefitSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const data = parsed.data;
    const catalog = listaSocios.find((s) => s.id === data.socioId);
    const existing = await prisma.catalogMembership.findUnique({
      where: { socioId: data.socioId },
    });
    if (!catalog && !existing) {
      return { ok: false, error: "Socio del catálogo no encontrado." };
    }

    if (data.offersBenefit) {
      if (!data.benefitTitle.trim()) return { ok: false, error: "Indica el título del beneficio." };
      if (!data.benefitDescription.trim()) {
        return { ok: false, error: "Describe qué ofrece el beneficio." };
      }
      if (!data.benefitRedeemViaQr && !data.benefitHowToRedeem.trim()) {
        return { ok: false, error: "Explica cómo se hace válido el beneficio." };
      }
    }

    const benefitPayload = {
      offersBenefit: data.offersBenefit,
      benefitTitle: data.offersBenefit ? data.benefitTitle.trim() : null,
      benefitDescription: data.offersBenefit ? data.benefitDescription.trim() : null,
      benefitRedeemViaQr: data.offersBenefit ? data.benefitRedeemViaQr : false,
      benefitHowToRedeem: data.offersBenefit
        ? data.benefitRedeemViaQr
          ? data.benefitHowToRedeem.trim() ||
            "Muestra este QR al negocio para validar tu membresía."
          : data.benefitHowToRedeem.trim()
        : null,
      benefitValidFrom: data.offersBenefit ? parseOptionalBenefitDate(data.benefitValidFrom) : null,
      benefitValidUntil: data.offersBenefit
        ? parseOptionalBenefitDate(data.benefitValidUntil)
        : null,
    };

    await prisma.catalogMembership.upsert({
      where: { socioId: data.socioId },
      create: {
        socioId: data.socioId,
        plan: existing?.plan ?? "NEGOCIO_FAMILIAR",
        status: existing?.status ?? "active",
        businessName:
          existing?.businessName?.trim() || catalog?.name || `Socio #${data.socioId}`,
        category: existing?.category ?? catalog?.categoria ?? null,
        ...benefitPayload,
      },
      update: benefitPayload,
    });

    const linked = await prisma.user.findFirst({
      where: { socioId: data.socioId },
      select: { id: true },
    });
    if (linked) {
      await prisma.socioProfile.updateMany({
        where: { userId: linked.id },
        data: benefitPayload,
      });
    }

    revalidatePath("/admin");
    revalidatePath("/panel");
    revalidatePath("/socios");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    console.error("[admin] updateCatalogMembershipBenefit failed:", error);
    return { ok: false, error: "No se pudo guardar el beneficio." };
  }
}

export async function setCatalogMembershipStatus(
  socioId: number,
  status: "active" | "inactive"
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return { ok: false, error: "No autorizado." };

    const catalog = listaSocios.find((s) => s.id === socioId);
    const existing = await prisma.catalogMembership.findUnique({ where: { socioId } });
    if (!catalog && !existing) {
      return { ok: false, error: "Socio del catálogo no encontrado." };
    }

    await prisma.catalogMembership.upsert({
      where: { socioId },
      create: {
        socioId,
        plan: "NEGOCIO_FAMILIAR",
        status,
        businessName: existing?.businessName?.trim() || catalog?.name || `Socio #${socioId}`,
        category: existing?.category ?? catalog?.categoria ?? null,
      },
      update: { status },
    });

    revalidatePath("/admin");
    revalidatePath("/socios");
    revalidatePath("/pasaporte");
    revalidatePath("/map");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo actualizar la membresía." };
  }
}

/** Quita el negocio del roster de Operaciones (no borra la cuenta de usuario). */
export async function deleteCatalogMembership(socioId: number): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return { ok: false, error: "No autorizado." };

    const existing = await prisma.catalogMembership.findUnique({ where: { socioId } });
    if (!existing) {
      return { ok: false, error: "El negocio no está en el roster." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.catalogSocioOverride.deleteMany({ where: { socioId } });
      await tx.catalogMembership.delete({ where: { socioId } });
      const linked = await tx.user.findMany({
        where: { socioId },
        select: { id: true },
      });
      if (linked.length > 0) {
        await tx.user.updateMany({
          where: { socioId },
          data: { socioId: null },
        });
        await tx.socioProfile.updateMany({
          where: { userId: { in: linked.map((u) => u.id) } },
          data: { rosterExcluded: true },
        });
      }
    });

    revalidatePath("/admin");
    revalidatePath("/panel");
    revalidatePath("/socios");
    revalidatePath("/pasaporte");
    revalidatePath("/map");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    console.error("[admin] deleteCatalogMembership failed:", error);
    return { ok: false, error: "No se pudo eliminar el negocio del roster." };
  }
}

export async function updateCatalogSocioWebsite(input: {
  socioId: number;
  website: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) {
      return { ok: false, error: "No autorizado." };
    }

    const parsed = catalogWebsiteSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Datos inválidos." };
    }

    const { socioId, website } = parsed.data;
    const catalog = listaSocios.find((s) => s.id === socioId);
    const existing = await prisma.catalogMembership.findUnique({ where: { socioId } });
    if (!catalog && !existing) {
      return { ok: false, error: "Socio del catálogo no encontrado." };
    }

    if (!website) {
      await prisma.catalogSocioOverride.deleteMany({ where: { socioId } });
    } else {
      let normalized = website;
      if (!/^https?:\/\//i.test(normalized)) {
        normalized = `https://${normalized}`;
      }
      try {
        void new URL(normalized);
      } catch {
        return { ok: false, error: "URL de sitio web inválida." };
      }

      await prisma.catalogSocioOverride.upsert({
        where: { socioId },
        create: { socioId, website: normalized },
        update: { website: normalized },
      });
    }

    revalidatePath("/admin");
    revalidatePath("/socios");
    revalidatePath("/map");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    console.error("[admin] updateCatalogSocioWebsite failed:", error);
    return { ok: false, error: "No se pudo guardar el sitio web." };
  }
}

const adminBusinessProfileSchema = z.object({
  socioId: z.number().int().positive(),
  businessName: z.string().trim().max(120),
  website: z.string().trim().max(500),
  googleBusinessUrl: z.string().trim().max(500).optional(),
  category: z.string().trim().max(120),
  address: z.string().trim().max(400).optional(),
  street: z.string().trim().max(200).optional(),
  streetNumber: z.string().trim().max(40).optional(),
  colonia: z.string().trim().max(120).optional(),
  codigoPostal: z.string().trim().max(10).optional(),
  municipio: z.string().trim().max(120).optional(),
  estado: z.string().trim().max(80).optional(),
  pais: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  contactFirstName: z.string().trim().max(80).optional(),
  contactLastNamePaternal: z.string().trim().max(80).optional(),
  contactLastNameMaternal: z.string().trim().max(80).optional(),
  contactRole: z.string().trim().max(40).optional(),
  contactBirthDate: z.string().trim().max(32).optional(),
  contactWhatsapp: z.string().trim().max(30).optional(),
  contactEmail: z.string().trim().max(160).optional(),
  rfc: z.string().trim().max(13).optional(),
  razonSocial: z.string().trim().max(200).optional(),
  personaTipo: z.string().trim().max(20).optional(),
  regimenFiscal: z.string().trim().max(160).optional(),
  usoCfdi: z.string().trim().max(160).optional(),
  billingStreet: z.string().trim().max(200).optional(),
  billingStreetNumber: z.string().trim().max(40).optional(),
  billingColonia: z.string().trim().max(120).optional(),
  billingCiudad: z.string().trim().max(120).optional(),
  billingMunicipio: z.string().trim().max(120).optional(),
  billingEstado: z.string().trim().max(80).optional(),
  billingPais: z.string().trim().max(80).optional(),
  billingCodigoPostal: z.string().trim().max(10).optional(),
  billingAddressFull: z.string().trim().max(400).optional(),
  billingWhatsapp: z.string().trim().max(30).optional(),
  billingEmail: z.string().trim().max(160).optional(),
  billingSameWhatsapp: z.boolean().optional(),
  billingSameEmail: z.boolean().optional(),
  billingSameAddress: z.boolean().optional(),
  privacyAccepted: z.boolean().optional(),
});

/**
 * Guarda perfil de negocio desde /admin.
 * Siempre actualiza roster (nombre) + website override.
 * Si hay cuenta vinculada, también escribe SocioProfile (ubicación + CFDI).
 */
export async function adminUpdateBusinessProfile(
  input: z.infer<typeof adminBusinessProfileSchema>
): Promise<{ ok: true; warning?: string } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    if (!isAdminUser(session)) return { ok: false, error: "No autorizado." };

    const parsed = adminBusinessProfileSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const data = parsed.data;
    const catalog = listaSocios.find((s) => s.id === data.socioId);
    const existing = await prisma.catalogMembership.findUnique({ where: { socioId: data.socioId } });
    if (!catalog && !existing) {
      return { ok: false, error: "Socio del catálogo no encontrado." };
    }

    const businessName =
      data.businessName.trim() || existing?.businessName?.trim() || catalog?.name || `Socio #${data.socioId}`;
    const website = data.website.trim();
    const category = data.category.trim() || existing?.category || catalog?.categoria || null;

    await prisma.catalogMembership.upsert({
      where: { socioId: data.socioId },
      create: {
        socioId: data.socioId,
        plan: existing?.plan ?? "NEGOCIO_FAMILIAR",
        status: existing?.status ?? "active",
        businessName,
        category,
        paymentMethod: existing?.paymentMethod ?? null,
      },
      update: { businessName, category },
    });

    if (!website) {
      await prisma.catalogSocioOverride.deleteMany({ where: { socioId: data.socioId } });
    } else {
      let normalized = website;
      if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
      await prisma.catalogSocioOverride.upsert({
        where: { socioId: data.socioId },
        create: { socioId: data.socioId, website: normalized },
        update: { website: normalized },
      });
    }

    const linked = await prisma.user.findFirst({
      where: { socioId: data.socioId },
      select: { id: true, email: true },
    });

    if (!linked) {
      revalidatePath("/admin");
      revalidatePath("/socios");
      return {
        ok: true,
        warning:
          "Nombre y sitio web guardados en roster. Ubicación y facturación requieren cuenta vinculada.",
      };
    }

    const formPayload: SocioProfileFormInitial = {
      ...emptyBusinessProfile(linked.email ?? ""),
      ...data,
      businessName,
      website,
      googleBusinessUrl: data.googleBusinessUrl ?? "",
      category: data.category ?? "",
      address: data.address ?? "",
      street: data.street ?? "",
      streetNumber: data.streetNumber ?? "",
      colonia: data.colonia ?? "",
      codigoPostal: data.codigoPostal ?? "",
      municipio: data.municipio ?? "",
      estado: data.estado ?? "",
      pais: data.pais ?? "México",
      phone: data.phone ?? "",
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      contactFirstName: data.contactFirstName ?? "",
      contactLastNamePaternal: data.contactLastNamePaternal ?? "",
      contactLastNameMaternal: data.contactLastNameMaternal ?? "",
      contactRole: data.contactRole ?? "",
      contactBirthDate: data.contactBirthDate ?? "",
      contactWhatsapp: data.contactWhatsapp ?? "",
      contactEmail: data.contactEmail ?? linked.email ?? "",
      rfc: data.rfc ?? "",
      razonSocial: data.razonSocial ?? "",
      personaTipo: data.personaTipo ?? "",
      regimenFiscal: data.regimenFiscal ?? "",
      usoCfdi: data.usoCfdi ?? "",
      billingStreet: data.billingStreet ?? "",
      billingStreetNumber: data.billingStreetNumber ?? "",
      billingColonia: data.billingColonia ?? "",
      billingCiudad: data.billingCiudad ?? "",
      billingMunicipio: data.billingMunicipio ?? data.billingCiudad ?? "",
      billingEstado: data.billingEstado ?? "",
      billingPais: data.billingPais ?? "México",
      billingCodigoPostal: data.billingCodigoPostal ?? "",
      billingAddressFull: data.billingAddressFull ?? "",
      billingWhatsapp: data.billingWhatsapp ?? "",
      billingEmail: data.billingEmail ?? "",
      billingSameWhatsapp: data.billingSameWhatsapp ?? true,
      billingSameEmail: data.billingSameEmail ?? true,
      billingSameAddress: data.billingSameAddress ?? true,
      privacyAccepted: data.privacyAccepted ?? false,
    };

    const dbFields = toSocioProfileDbFields(formPayload);
    const { privacyAcceptedAt, ...profilePayload } = dbFields;

    await prisma.socioProfile.upsert({
      where: { userId: linked.id },
      create: {
        userId: linked.id,
        ...profilePayload,
        linkageStatus: "approved",
        ...(privacyAcceptedAt ? { privacyAcceptedAt } : {}),
      },
      update: {
        ...profilePayload,
        ...(privacyAcceptedAt ? { privacyAcceptedAt } : {}),
      },
    });

    revalidatePath("/admin");
    revalidatePath("/panel");
    revalidatePath("/socios");
    revalidatePath("/map");
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    console.error("[admin] adminUpdateBusinessProfile failed:", error);
    return { ok: false, error: "No se pudo guardar el perfil del negocio." };
  }
}
