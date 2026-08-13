import { resolvePublicAppOrigin, sendEmail } from "@/lib/email";
import { escapeHtml, renderBrandedEmailHtml } from "@/lib/email-layout";
import { MEMBERSHIP_PLANS, formatPlanPriceMxn, type PaidMembershipPlan } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";

function isPaidPlan(plan: MembershipPlan): plan is PaidMembershipPlan {
  return plan !== "TURISTA";
}

export async function notifyRenewalReminder(params: {
  to: string;
  nombre?: string | null;
  plan: MembershipPlan;
  periodEnd: Date;
}): Promise<{ ok: boolean; error?: string }> {
  const planLabel = MEMBERSHIP_PLANS[params.plan]?.label ?? params.plan;
  const origin = resolvePublicAppOrigin();
  const panelUrl = `${origin}/panel?seccion=membresia`;
  const firstName = params.nombre?.trim()?.split(/\s+/)[0] || null;
  const periodLabel = params.periodEnd.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Mexico_City",
  });
  const amountLabel = isPaidPlan(params.plan) ? formatPlanPriceMxn(params.plan) : null;

  const greeting = firstName
    ? `Hola <strong style="color:#0f172a;">${escapeHtml(firstName)}</strong>,`
    : "Hola,";

  const bodyHtml = `
    <p style="margin:0 0 14px;">${greeting}</p>
    <p style="margin:0 0 14px;">
      Tu membresía <strong style="color:#0f172a;">${escapeHtml(planLabel)}</strong> vence el
      <strong style="color:#0f172a;">${escapeHtml(periodLabel)}</strong> (en 5 días).
    </p>
    <p style="margin:0;">
      Como tu pago es mensual por transferencia, OXXO o efectivo, renuévalo desde tu panel
      para no perder el acceso.${amountLabel ? ` El monto es <strong style="color:#0f172a;">${escapeHtml(amountLabel)}</strong>.` : ""}
    </p>
  `;

  const asideHtml = `
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;">
      Recordatorio
    </p>
    <p style="margin:0;font-size:13px;line-height:1.55;color:#475569;">
      Plan: <strong style="color:#0f172a;">${escapeHtml(planLabel)}</strong><br/>
      Vence: <strong style="color:#0f172a;">${escapeHtml(periodLabel)}</strong>
      ${amountLabel ? `<br/>Monto: <strong style="color:#0f172a;">${escapeHtml(amountLabel)}</strong>` : ""}
    </p>
  `;

  const subject = `Tu membresía vence en 5 días — plan ${planLabel}`;
  const text = [
    firstName ? `Hola ${firstName},` : "Hola,",
    "",
    `Tu membresía ${planLabel} vence el ${periodLabel} (en 5 días).`,
    "Como tu pago es mensual por transferencia, OXXO o efectivo, renuévalo desde tu panel para no perder el acceso.",
    amountLabel ? `Monto: ${amountLabel}.` : null,
    "",
    `Panel: ${panelUrl}`,
    "",
    "— Barriando",
  ]
    .filter(Boolean)
    .join("\n");

  const html = renderBrandedEmailHtml({
    eyebrow: "Renovación",
    title: "Tu membresía vence en 5 días",
    preheader: `Plan ${planLabel} vigente hasta el ${periodLabel}. Renueva desde tu panel.`,
    bodyHtml,
    ctaLabel: "Renovar en mi panel",
    ctaUrl: panelUrl,
    asideHtml,
    footerNote:
      "Este aviso es solo para pagos mensuales manuales. Si domicilias con tarjeta, no necesitas hacer nada.",
  });

  return sendEmail({
    to: params.to,
    subject,
    html,
    text,
    tags: ["renewal-reminder", "manual"],
  });
}
