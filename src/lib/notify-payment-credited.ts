import { resolveAppOrigin, sendEmail } from "@/lib/email";
import { escapeHtml, renderBrandedEmailHtml } from "@/lib/email-layout";
import { MEMBERSHIP_PLANS, formatPlanPriceMxn, type PaidMembershipPlan } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";

const METHOD_LABELS: Record<string, string> = {
  oxxo: "OXXO",
  transfer: "transferencia",
  cash: "efectivo",
  stripe: "tarjeta",
  spei: "SPEI",
};

function isPaidPlan(plan: MembershipPlan): plan is PaidMembershipPlan {
  return plan !== "TURISTA";
}

export async function notifyPaymentCredited(params: {
  to: string;
  nombre?: string | null;
  plan: MembershipPlan;
  paymentMethod: string;
  /** Monto en centavos MXN (Stripe amount_total) */
  amountCents?: number | null;
  periodEnd?: Date | null;
}): Promise<void> {
  const { to, plan, paymentMethod } = params;
  const methodLabel = METHOD_LABELS[paymentMethod] || paymentMethod;
  const planLabel = MEMBERSHIP_PLANS[plan]?.label ?? plan;
  const origin = resolveAppOrigin();
  const panelUrl = `${origin}/panel`;
  const firstName = params.nombre?.trim()?.split(/\s+/)[0] || null;

  let amountLabel: string | null = null;
  if (typeof params.amountCents === "number" && params.amountCents > 0) {
    amountLabel = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(params.amountCents / 100);
  } else if (isPaidPlan(plan)) {
    amountLabel = formatPlanPriceMxn(plan);
  }

  const periodLabel = params.periodEnd
    ? params.periodEnd.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const greeting = firstName
    ? `Hola <strong style="color:#0f172a;">${escapeHtml(firstName)}</strong>,`
    : "Hola,";

  const bodyHtml = `
    <p style="margin:0 0 14px;">${greeting}</p>
    <p style="margin:0 0 14px;">
      Ya se acreditó tu pago${paymentMethod === "oxxo" ? " en <strong style=\"color:#0f172a;\">OXXO</strong>" : ` por <strong style="color:#0f172a;">${escapeHtml(methodLabel)}</strong>`}.
      Tu plan <strong style="color:#0f172a;">${escapeHtml(planLabel)}</strong> quedó activo.
    </p>
    <p style="margin:0;">
      ${amountLabel ? `Monto: <strong style="color:#0f172a;">${escapeHtml(amountLabel)}</strong>. ` : ""}
      ${periodLabel ? `Vigencia hasta el <strong style="color:#0f172a;">${escapeHtml(periodLabel)}</strong>.` : "Ya puedes usar tu membresía en el panel."}
    </p>
  `;

  const asideHtml = `
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;">
      Resumen
    </p>
    <p style="margin:0;font-size:13px;line-height:1.55;color:#475569;">
      Plan: <strong style="color:#0f172a;">${escapeHtml(planLabel)}</strong><br/>
      Método: <strong style="color:#0f172a;">${escapeHtml(methodLabel)}</strong>
      ${amountLabel ? `<br/>Monto: <strong style="color:#0f172a;">${escapeHtml(amountLabel)}</strong>` : ""}
    </p>
  `;

  const subject =
    paymentMethod === "oxxo"
      ? `Pago OXXO acreditado — plan ${planLabel}`
      : `Pago acreditado — plan ${planLabel}`;

  const text = [
    firstName ? `Hola ${firstName},` : "Hola,",
    "",
    paymentMethod === "oxxo"
      ? `Ya se acreditó tu pago en OXXO. Tu plan ${planLabel} quedó activo.`
      : `Ya se acreditó tu pago por ${methodLabel}. Tu plan ${planLabel} quedó activo.`,
    amountLabel ? `Monto: ${amountLabel}.` : null,
    periodLabel ? `Vigencia hasta el ${periodLabel}.` : null,
    "",
    `Panel: ${panelUrl}`,
    "",
    "— Barriando",
  ]
    .filter(Boolean)
    .join("\n");

  const html = renderBrandedEmailHtml({
    eyebrow: "Pago acreditado",
    title: paymentMethod === "oxxo" ? "Tu pago en OXXO quedó acreditado" : "Tu pago quedó acreditado",
    preheader:
      paymentMethod === "oxxo"
        ? `Pago OXXO acreditado. Plan ${planLabel} activo.`
        : `Pago acreditado. Plan ${planLabel} activo.`,
    bodyHtml,
    ctaLabel: "Ir a mi panel",
    ctaUrl: panelUrl,
    asideHtml,
    footerNote: "Si no reconoces este pago, escribe a clusterturistico.pue@gmail.com.",
  });

  await sendEmail({
    to,
    subject,
    html,
    text,
    tags: ["payment-credited", paymentMethod],
  });
}
