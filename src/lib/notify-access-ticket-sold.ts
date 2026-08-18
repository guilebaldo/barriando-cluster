import { resolvePublicAppOrigin, sendEmail } from "@/lib/email";
import { escapeHtml, renderBrandedEmailHtml } from "@/lib/email-layout";
import { prisma } from "@/lib/prisma";
import { formatAccessPriceMxn, formatAccessWhen } from "@/lib/access-events";

export async function notifyHostAccessTicketSold(params: {
  eventId: string;
  qty: number;
  amountCents: number;
  buyerUserId: string;
}): Promise<void> {
  try {
    const [event, buyer] = await Promise.all([
      prisma.accessEvent.findUnique({
        where: { id: params.eventId },
        select: {
          title: true,
          venue: true,
          hostEmail: true,
          startsAt: true,
          endsAt: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: params.buyerUserId },
        select: { nombre: true, email: true },
      }),
    ]);
    if (!event?.hostEmail) return;

    const origin = resolvePublicAppOrigin();
    const eventUrl = `${origin}/pases/${params.eventId}`;
    const buyerName = buyer?.nombre?.trim() || buyer?.email || "Visitante";
    const qtyLabel = params.qty === 1 ? "1 pase" : `${params.qty} pases`;
    const priceLabel = formatAccessPriceMxn(params.amountCents);
    const when = formatAccessWhen(event.startsAt.toISOString(), event.endsAt?.toISOString() ?? null);

    const bodyHtml = `
      <p style="margin:0 0 14px;">Hola,</p>
      <p style="margin:0 0 14px;">
        Alguien acaba de obtener <strong style="color:#0f172a;">${escapeHtml(qtyLabel)}</strong>
        para <strong style="color:#0f172a;">${escapeHtml(event.title)}</strong>.
      </p>
      <p style="margin:0;">
        Comprador: <strong style="color:#0f172a;">${escapeHtml(buyerName)}</strong>.
      </p>
    `;

    const asideHtml = `
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;">
        Evento
      </p>
      <p style="margin:0;font-size:13px;line-height:1.55;color:#475569;">
        ${escapeHtml(event.title)}<br/>
        ${escapeHtml(when)}<br/>
        ${escapeHtml(event.venue)}<br/>
        ${escapeHtml(qtyLabel)} · ${escapeHtml(priceLabel)}
      </p>
    `;

    await sendEmail({
      to: event.hostEmail,
      subject: `Nuevo pase — ${event.title}`,
      html: renderBrandedEmailHtml({
        eyebrow: "Pases",
        title: "Alguien obtuvo un pase de tu evento",
        preheader: `${qtyLabel} para ${event.title}.`,
        bodyHtml,
        ctaLabel: "Ver evento",
        ctaUrl: eventUrl,
        asideHtml,
        footerNote: "Recibes este aviso porque eres el responsable de este evento en Barriando.",
      }),
      text: [
        "Hola,",
        "",
        `Alguien acaba de obtener ${qtyLabel} para ${event.title}.`,
        `Comprador: ${buyerName}.`,
        `${when} · ${event.venue}`,
        `${qtyLabel} · ${priceLabel}`,
        "",
        eventUrl,
        "",
        "— Barriando",
      ].join("\n"),
      tags: ["pase-host-sold"],
    });
  } catch (error) {
    console.error("[pases] host sold email failed:", error);
  }
}
