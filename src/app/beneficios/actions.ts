"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-utils";
import { isBusinessPlan, isPaidMember, getPlanLabel, getSubscriptionStatusLabel } from "@/lib/membresia";
import { isLinkageApproved } from "@/lib/linkage";
import { verifyBenefitCredentialToken } from "@/lib/benefit-credential";
import { resolveMembershipExpiryLabel } from "@/lib/panel-display";

export type ConfirmBenefitRedemptionResult =
  | { ok: true; beneficiaryName: string }
  | { ok: false; error: string };

export type BenefitVerifyPayload = {
  beneficiary: {
    id: string;
    nombre: string;
    email: string;
    planLabel: string;
    statusLabel: string;
    expiryLabel: string;
  };
  tokenValid: true;
};

export async function loadBenefitVerifyPayload(
  token: string
): Promise<{ ok: true; data: BenefitVerifyPayload } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    const providerSub = await prisma.subscription.findUnique({ where: { userId: session.id } });
    const providerProfile = await prisma.socioProfile.findUnique({ where: { userId: session.id } });

    if (
      !providerSub ||
      !isBusinessPlan(providerSub.plan) ||
      !isPaidMember(providerSub.plan, providerSub.status)
    ) {
      return {
        ok: false,
        error: "Debes iniciar sesión como socio de negocio con membresía activa para validar beneficios.",
      };
    }

    if (!providerProfile || !isLinkageApproved(providerProfile.linkageStatus)) {
      return {
        ok: false,
        error: "Tu negocio debe estar vinculado y aprobado para validar canjes.",
      };
    }

    const verified = await verifyBenefitCredentialToken(token);
    if (!verified) {
      return { ok: false, error: "Credencial inválida o expirada. Pide al socio generar un QR nuevo." };
    }

    const beneficiary = await prisma.user.findUnique({
      where: { id: verified.userId },
      include: { subscription: true },
    });

    if (!beneficiary?.subscription || !isPaidMember(beneficiary.subscription.plan, beneficiary.subscription.status)) {
      return {
        ok: false,
        error: "El titular de la credencial no tiene una membresía de pago activa.",
      };
    }

    return {
      ok: true,
      data: {
        tokenValid: true,
        beneficiary: {
          id: beneficiary.id,
          nombre: beneficiary.nombre?.trim() || beneficiary.email || "Socio",
          email: beneficiary.email ?? "",
          planLabel: getPlanLabel(beneficiary.subscription.plan),
          statusLabel: getSubscriptionStatusLabel(beneficiary.subscription.status),
          expiryLabel: resolveMembershipExpiryLabel({
            status: beneficiary.subscription.status,
            currentPeriodEnd: beneficiary.subscription.currentPeriodEnd?.toISOString() ?? null,
            subscriptionCreatedAt: beneficiary.subscription.createdAt?.toISOString() ?? null,
            stripeSubscriptionId: beneficiary.subscription.stripeSubscriptionId,
          }),
        },
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión para validar el beneficio." };
    }
    return { ok: false, error: "No se pudo verificar la credencial." };
  }
}

export async function confirmBenefitRedemption(
  token: string
): Promise<ConfirmBenefitRedemptionResult> {
  try {
    const session = await requireSession();
    const providerSub = await prisma.subscription.findUnique({ where: { userId: session.id } });
    const providerProfile = await prisma.socioProfile.findUnique({ where: { userId: session.id } });

    if (
      !providerSub ||
      !isBusinessPlan(providerSub.plan) ||
      !isPaidMember(providerSub.plan, providerSub.status) ||
      !providerProfile ||
      !isLinkageApproved(providerProfile.linkageStatus)
    ) {
      return { ok: false, error: "No estás autorizado para confirmar este canje." };
    }

    const verified = await verifyBenefitCredentialToken(token);
    if (!verified) {
      return { ok: false, error: "Credencial inválida o expirada." };
    }

    if (verified.userId === session.id) {
      return { ok: false, error: "No puedes canjear tu propia credencial." };
    }

    const beneficiary = await prisma.user.findUnique({
      where: { id: verified.userId },
      include: { subscription: true },
    });

    if (!beneficiary?.subscription || !isPaidMember(beneficiary.subscription.plan, beneficiary.subscription.status)) {
      return { ok: false, error: "El beneficiario no tiene membresía activa." };
    }

    await prisma.benefitRedemption.create({
      data: {
        beneficiaryUserId: beneficiary.id,
        providerUserId: session.id,
        socioProfileId: providerProfile.id,
      },
    });

    return {
      ok: true,
      beneficiaryName: beneficiary.nombre?.trim() || beneficiary.email || "Socio",
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo registrar el canje. Intenta de nuevo." };
  }
}
