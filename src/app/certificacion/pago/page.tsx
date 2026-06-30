import { redirect } from "next/navigation";
import CertificacionPagoClient from "./CertificacionPagoClient";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured } from "@/lib/stripe";
import { getBarriandoPaymentDetails } from "@/lib/payment";
import {
  hasCommercialAccess,
  isTuristaPlan,
  needsCertificationPayment,
} from "@/lib/membresia";
import { normalizePanelSubscription } from "@/lib/panel-data";

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

  const sub = normalizePanelSubscription(user.subscription);

  if (isTuristaPlan(sub.plan)) {
    redirect("/planes");
  }

  if (hasCommercialAccess(sub.plan, sub.status)) {
    redirect("/panel?pago=exitoso");
  }

  if (!needsCertificationPayment(sub.plan, sub.status) && sub.status === "manual_pending") {
    redirect("/panel");
  }

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
      stripeConfigured={isStripeConfigured()}
      paymentDetails={getBarriandoPaymentDetails()}
      cancelNotice={cancelNotice}
    />
  );
}
