import { resolvePublicAppOrigin, sendEmail } from "@/lib/email";
import { escapeHtml, renderBrandedEmailHtml } from "@/lib/email-layout";
import { prisma } from "@/lib/prisma";
import { formatAccessWhen } from "@/lib/access-events";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Uno o varios correos separados por coma o punto y coma. */
export function parseHostNotifyEmails(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,;]+/)) {
    const email = part.trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email) || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

/** Solo nombre visible; nunca el correo del asistente (el responsable puede no ser admin). */
function holderDisplayName(nombre: string | null | undefined): string {
  return nombre?.trim() || "Sin nombre";
}

function capacitySummary(sold: number, capacity: number | null): string {
  if (capacity == null) {
    return sold === 1 ? "1 pase emitido · sin límite de cupo" : `${sold} pases emitidos · sin límite de cupo`;
  }
  const left = Math.max(0, capacity - sold);
  return `${sold} emitidos · ${left} disponibles (cupo ${capacity})`;
}

function formatHoldersList(
  tickets: Array<{ user: { nombre: string | null } }>
): { html: string; text: string } {
  if (tickets.length === 0) {
    return {
      html: `<p style="margin:0;font-size:13px;color:#64748b;">Nadie tiene pase todavía.</p>`,
      text: "Nadie tiene pase todavía.",
    };
  }
  const lines = tickets.map((ticket, i) => {
    const name = holderDisplayName(ticket.user.nombre);
    return {
      html: `<li style="margin:0 0 4px;">${i + 1}. ${escapeHtml(name)}</li>`,
      text: `${i + 1}. ${name}`,
    };
  });
  return {
    html: `<ol style="margin:0;padding-left:18px;font-size:13px;line-height:1.5;color:#334155;">${lines
      .map((l) => l.html)
      .join("")}</ol>`,
    text: lines.map((l) => l.text).join("\n"),
  };
}

async function loadHostNotifyContext(eventId: string) {
  return prisma.accessEvent.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      venue: true,
      hostEmail: true,
      startsAt: true,
      endsAt: true,
      capacity: true,
      tickets: {
        orderBy: { createdAt: "asc" },
        select: {
          user: { select: { nombre: true } },
        },
      },
    },
  });
}

export async function notifyHostAccessTicketSold(params: {
  eventId: string;
  qty: number;
  amountCents: number;
  buyerUserId: string;
}): Promise<void> {
  try {
    const [event, buyer] = await Promise.all([
      loadHostNotifyContext(params.eventId),
      prisma.user.findUnique({
        where: { id: params.buyerUserId },
        select: { nombre: true },
      }),
    ]);
    const recipients = parseHostNotifyEmails(event?.hostEmail);
    if (!event || recipients.length === 0) return;

    const origin = resolvePublicAppOrigin();
    const eventUrl = `${origin}/pases/${params.eventId}`;
    const buyerName = holderDisplayName(buyer?.nombre);
    const qtyLabel = params.qty === 1 ? "1 pase" : `${params.qty} pases`;
    const when = formatAccessWhen(
      event.startsAt.toISOString(),
      event.endsAt?.toISOString() ?? null
    );
    const sold = event.tickets.length;
    const cupo = capacitySummary(sold, event.capacity);
    const holders = formatHoldersList(event.tickets);

    const bodyHtml = `
      <p style="margin:0 0 14px;">Hola,</p>
      <p style="margin:0 0 14px;">
        Acaban de confirmar <strong style="color:#0f172a;">${escapeHtml(qtyLabel)}</strong>
        para <strong style="color:#0f172a;">${escapeHtml(event.title)}</strong>.
      </p>
      <p style="margin:0 0 14px;">
        Comprador: <strong style="color:#0f172a;">${escapeHtml(buyerName)}</strong>.
      </p>
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#94a3b8;">
        Cupo
      </p>
      <p style="margin:0 0 14px;">${escapeHtml(cupo)}</p>
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#94a3b8;">
        Lista de pases
      </p>
      ${holders.html}
    `;

    const asideHtml = `
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;">
        Evento
      </p>
      <p style="margin:0;font-size:13px;line-height:1.55;color:#475569;">
        ${escapeHtml(event.title)}<br/>
        ${escapeHtml(when)}<br/>
        ${escapeHtml(event.venue)}
      </p>
    `;

    await sendEmail({
      to: recipients,
      subject: `Nuevo pase — ${event.title}`,
      html: renderBrandedEmailHtml({
        eyebrow: "Pases",
        title: "Confirmación de pase",
        preheader: `${qtyLabel} para ${event.title}. ${cupo}.`,
        bodyHtml,
        asideHtml,
        footerNote: `Página del evento: ${eventUrl}`,
      }),
      text: [
        "Hola,",
        "",
        `Acaban de confirmar ${qtyLabel} para ${event.title}.`,
        `Comprador: ${buyerName}.`,
        "",
        `Cupo: ${cupo}`,
        "",
        "Lista de pases:",
        holders.text,
        "",
        when,
        event.venue,
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

export async function notifyHostAccessTicketCancelled(params: {
  eventId: string;
  cancelledByUserId: string;
  qty?: number;
}): Promise<void> {
  try {
    const [event, cancelledBy] = await Promise.all([
      loadHostNotifyContext(params.eventId),
      prisma.user.findUnique({
        where: { id: params.cancelledByUserId },
        select: { nombre: true },
      }),
    ]);
    const recipients = parseHostNotifyEmails(event?.hostEmail);
    if (!event || recipients.length === 0) return;

    const origin = resolvePublicAppOrigin();
    const eventUrl = `${origin}/pases/${params.eventId}`;
    const who = holderDisplayName(cancelledBy?.nombre);
    const qty = params.qty ?? 1;
    const qtyLabel = qty === 1 ? "1 pase" : `${qty} pases`;
    const when = formatAccessWhen(
      event.startsAt.toISOString(),
      event.endsAt?.toISOString() ?? null
    );
    const sold = event.tickets.length;
    const cupo = capacitySummary(sold, event.capacity);
    const holders = formatHoldersList(event.tickets);

    const bodyHtml = `
      <p style="margin:0 0 14px;">Hola,</p>
      <p style="margin:0 0 14px;">
        Se canceló / borró <strong style="color:#0f172a;">${escapeHtml(qtyLabel)}</strong>
        de <strong style="color:#0f172a;">${escapeHtml(event.title)}</strong>.
      </p>
      <p style="margin:0 0 14px;">
        Persona: <strong style="color:#0f172a;">${escapeHtml(who)}</strong>.
      </p>
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#94a3b8;">
        Cupo actualizado
      </p>
      <p style="margin:0 0 14px;">${escapeHtml(cupo)}</p>
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#94a3b8;">
        Lista de pases
      </p>
      ${holders.html}
    `;

    const asideHtml = `
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;">
        Evento
      </p>
      <p style="margin:0;font-size:13px;line-height:1.55;color:#475569;">
        ${escapeHtml(event.title)}<br/>
        ${escapeHtml(when)}<br/>
        ${escapeHtml(event.venue)}
      </p>
    `;

    await sendEmail({
      to: recipients,
      subject: `Pase cancelado — ${event.title}`,
      html: renderBrandedEmailHtml({
        eyebrow: "Pases",
        title: "Cancelación de pase",
        preheader: `${qtyLabel} liberado. ${cupo}.`,
        bodyHtml,
        asideHtml,
        footerNote: `Página del evento: ${eventUrl}`,
      }),
      text: [
        "Hola,",
        "",
        `Se canceló / borró ${qtyLabel} de ${event.title}.`,
        `Persona: ${who}.`,
        "",
        `Cupo actualizado: ${cupo}`,
        "",
        "Lista de pases:",
        holders.text,
        "",
        when,
        event.venue,
        "",
        eventUrl,
        "",
        "— Barriando",
      ].join("\n"),
      tags: ["pase-host-cancelled"],
    });
  } catch (error) {
    console.error("[pases] host cancel email failed:", error);
  }
}
