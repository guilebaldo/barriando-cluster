import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { advanceBillingAnniversary } from "@/lib/subscription-lifecycle";

/** Roster status: socio creado a mano, aún no verificó correo → no publica en /socios ni MAP. */
export const PENDING_INVITE_STATUS = "pending_invite";

const INVITE_DAYS = 30;
const INVITE_PREFIX = "socio-invite:";

export function inviteIdentifierForUser(userId: string): string {
  return `${INVITE_PREFIX}${userId}`;
}

export function userIdFromInviteIdentifier(identifier: string): string | null {
  if (!identifier.startsWith(INVITE_PREFIX)) return null;
  const id = identifier.slice(INVITE_PREFIX.length).trim();
  return id || null;
}

export async function createSocioInviteToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date();
  expires.setDate(expires.getDate() + INVITE_DAYS);
  const identifier = inviteIdentifierForUser(userId);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

export function buildInviteVerifyUrl(origin: string, token: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/invitar/verificar?token=${encodeURIComponent(token)}`;
}

export async function getInviteUrlForUser(
  userId: string,
  origin: string
): Promise<string | null> {
  const identifier = inviteIdentifierForUser(userId);
  const existing = await prisma.verificationToken.findFirst({
    where: { identifier, expires: { gt: new Date() } },
    orderBy: { expires: "desc" },
  });
  if (existing) return buildInviteVerifyUrl(origin, existing.token);
  const token = await createSocioInviteToken(userId);
  return buildInviteVerifyUrl(origin, token);
}

/**
 * Marca email verificado, publica roster y activa membresía.
 * El socio luego entra con Google/Apple usando el mismo correo.
 */
export async function consumeSocioInviteToken(
  token: string
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row) {
    return { ok: false, error: "El enlace no es válido o ya se usó." };
  }

  const userId = userIdFromInviteIdentifier(row.identifier);
  if (!userId) {
    return { ok: false, error: "El enlace no corresponde a una invitación de socio." };
  }

  if (row.expires.getTime() < Date.now()) {
    await prisma.verificationToken.deleteMany({ where: { identifier: row.identifier } });
    return { ok: false, error: "El enlace expiró. Pide al administrador uno nuevo." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true, socioProfile: true },
  });
  if (!user?.email) {
    return { ok: false, error: "No se encontró la cuenta de socio." };
  }

  const socioId = user.socioId;
  const periodEnd = advanceBillingAnniversary(user.subscription?.currentPeriodEnd ?? null);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });

    if (user.socioProfile) {
      await tx.socioProfile.update({
        where: { userId },
        data: { rosterExcluded: false, linkageStatus: "approved" },
      });
    }

    if (user.subscription) {
      await tx.subscription.update({
        where: { userId },
        data: {
          status: "manual_active",
          currentPeriodEnd: periodEnd,
          ...(user.subscription.paymentMethod ? {} : { paymentMethod: "transfer" }),
        },
      });
    }

    if (socioId != null) {
      await tx.catalogMembership.updateMany({
        where: { socioId },
        data: { status: "active", currentPeriodEnd: periodEnd },
      });
    }

    await tx.verificationToken.deleteMany({ where: { identifier: row.identifier } });
  });

  revalidatePath("/socios");
  revalidatePath("/map");
  revalidatePath("/admin");
  revalidatePath("/barrid");

  return { ok: true, email: user.email };
}
