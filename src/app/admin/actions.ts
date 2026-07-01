"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-utils";
import { isAdminUser } from "@/lib/admin";
import { listaSocios } from "@/app/data/socios";
import { getPlanLabel } from "@/lib/membresia";
import { addThirtyDaysFrom } from "@/lib/subscription-lifecycle";
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
        currentPeriodEnd: addThirtyDaysFrom(),
      },
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
      if (!socio) return { ok: false, error: "Negocio no existe en el catálogo." };
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

    if (plan !== undefined || status !== undefined) {
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan: plan ?? "TURISTA",
          status: status ?? "inactive",
          ...(status === "manual_active" ? { currentPeriodEnd: addThirtyDaysFrom() } : {}),
        },
        update: {
          ...(plan !== undefined ? { plan } : {}),
          ...(status !== undefined
            ? {
                status,
                ...(status === "manual_active" ? { currentPeriodEnd: addThirtyDaysFrom() } : {}),
              }
            : {}),
        },
      });
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
    }

    revalidatePath("/admin");
    revalidatePath("/panel");
    revalidatePath("/socios");
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

    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/admin");
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
  regimenFiscal: true,
  usoCfdi: true,
  billingStreet: true,
  billingColonia: true,
  billingCiudad: true,
  billingEstado: true,
  billingPais: true,
  billingCodigoPostal: true,
  billingAddressFull: true,
} as const;

const EXTENDED_SOCIO_PROFILE_SELECT = {
  ...BASE_SOCIO_PROFILE_SELECT,
  linkageStatus: true,
  isManualEntry: true,
  address: true,
  category: true,
  ...EXTENDED_BILLING_SELECT,
} as const;

const SUBSCRIPTION_ADMIN_SELECT = {
  plan: true,
  status: true,
  currentPeriodEnd: true,
  manualPaymentNote: true,
  stripeSubscriptionId: true,
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
  } | null;
  socioProfile?: {
    businessName: string | null;
    website: string | null;
    googleBusinessUrl: string | null;
    logoUrl: string | null;
    linkageStatus?: string | null;
    isManualEntry?: boolean | null;
    address?: string | null;
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
            category: user.socioProfile.category ?? "",
            rfc: user.socioProfile.rfc ?? "",
            razonSocial: user.socioProfile.razonSocial ?? "",
            regimenFiscal: user.socioProfile.regimenFiscal ?? "",
            usoCfdi: user.socioProfile.usoCfdi ?? "",
            billingStreet: user.socioProfile.billingStreet ?? "",
            billingColonia: user.socioProfile.billingColonia ?? "",
            billingCiudad: user.socioProfile.billingCiudad ?? "",
            billingEstado: user.socioProfile.billingEstado ?? "",
            billingPais: user.socioProfile.billingPais ?? "",
            billingCodigoPostal: user.socioProfile.billingCodigoPostal ?? "",
            billingAddressFull: user.socioProfile.billingAddressFull ?? "",
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
