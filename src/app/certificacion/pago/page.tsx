import { redirect } from "next/navigation";
import CertificacionPagoClient from "./CertificacionPagoClient";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { isStripeConfiguredForPlan } from "@/lib/stripe";
import { getBarriandoPaymentDetails } from "@/lib/payment";
import {
  hasCommercialAccess,
  isOxxoPaymentAwaiting,
  isSoftUnpaidPlanIntent,
  isTuristaPlan,
  needsCertificationPayment,
} from "@/lib/membresia";
import { normalizePanelSubscription } from "@/lib/panel-data";
import { resolvePostAuthHomePathAfterPayment } from "@/lib/post-auth-home";
import { revertSoftUnpaidPlanIntentIfNeeded } from "@/lib/onboarding";

export default async function CertificacionPagoPage({
  searchParams,
}: {
  searchParams: Promise<{ pago?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { subscription: true },
  });
  if (!user) redirect("/login");

  let sub = normalizePanelSubscription(user.subscription);

  if (
    isSoftUnpaidPlanIntent({
      plan: sub.plan,
      status: sub.status,
      paymentMethod: sub.paymentMethod,
      stripeSubscriptionId: sub.stripeSubscriptionId,
    })
  ) {
    // Solo exploró el paywall: no mantenerlo aquí; vuelve a Turista + catálogo.
    await revertSoftUnpaidPlanIntentIfNeeded(session.id);
    redirect("/planes?tipo=personales");
  }

  if (isTuristaPlan(sub.plan)) {
    redirect("/planes");
  }

  if (hasCommercialAccess(sub.plan, sub.status)) {
    redirect(
      resolvePostAuthHomePathAfterPayment({
        email: session.email,
        role: session.role,
        plan: sub.plan,
        subscriptionStatus: sub.status,
        paymentMethod: sub.paymentMethod,
      })
    );
  }

  if (
    !needsCertificationPayment(
      sub.plan,
      sub.status,
      sub.paymentMethod,
      sub.stripeSubscriptionId
    ) &&
    sub.status === "manual_pending"
  ) {
    redirect("/panel");
  }

  const awaitingOxxo = isOxxoPaymentAwaiting(sub.plan, sub.status, sub.paymentMethod);

  let cancelNotice: string | null = null;
  if (params.pago === "cancelado") {
    cancelNotice =
      "Pago cancelado. Selecciona un método de pago para continuar con tu certificación.";
  } else if (params.pago === "stripe_no_configurado") {
    cancelNotice = "Stripe no está configurado aún. Usa transferencia bancaria o contacta al equipo.";
  }

  return (
    <CertificacionPagoClient
      plan={sub.plan}
      stripeConfigured={isStripeConfiguredForPlan(sub.plan)}
      paymentDetails={getBarriandoPaymentDetails()}
      cancelNotice={cancelNotice}
      awaitingOxxo={awaitingOxxo}
    />
  );
}
