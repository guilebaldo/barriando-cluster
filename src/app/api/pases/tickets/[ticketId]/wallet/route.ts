import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { getAppOrigin } from "@/lib/benefit-credential";
import { secureError } from "@/lib/api";
import { getOwnedAccessTicketForSave } from "@/lib/access-marketplace";
import {
  accessTicketIcsFilename,
  buildAccessTicketIcs,
} from "@/lib/access-ticket-save";
import { buildAccessTicketPkpass } from "@/lib/access-ticket-pkpass";
import {
  accessTicketTtlSeconds,
  buildAccessVerifyUrl,
  signAccessTicketToken,
} from "@/lib/access-ticket-credential";

export const runtime = "nodejs";

function isAppleMobile(request: Request): boolean {
  const ua = request.headers.get("user-agent") ?? "";
  return /iPhone|iPad|iPod/i.test(ua);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ ticketId: string }> }
) {
  const session = await getSession();
  if (!session) return secureError("Debes iniciar sesión.", 401);

  const { ticketId } = await context.params;
  const ticket = await getOwnedAccessTicketForSave(session.id, ticketId);
  if (!ticket) return secureError("No encontramos ese pase.", 404);

  const event = {
    title: ticket.event.title,
    venue: ticket.event.venue,
    latitude: ticket.event.latitude,
    longitude: ticket.event.longitude,
    startsAt: ticket.event.startsAt.toISOString(),
    endsAt: ticket.event.endsAt?.toISOString() ?? null,
  };
  const pageUrl = `${getAppOrigin()}/pases/mios`;

  // iOS Wallet rechaza .pkpass sin certificado Pass Type ID; Calendario sí guarda el evento.
  if (isAppleMobile(request) && !process.env.APPLE_PASS_TYPE_ID) {
    const ics = buildAccessTicketIcs({
      ticketId: ticket.id,
      event,
      pageUrl,
      alarmMinutes: 60,
    });
    const filename = accessTicketIcsFilename(ticket.event.title);
    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const expiresInSeconds = accessTicketTtlSeconds(
    ticket.event.endsAt,
    ticket.event.startsAt
  );
  const token = await signAccessTicketToken({
    userId: session.id,
    ticketId: ticket.id,
    code: ticket.code,
    expiresInSeconds,
  });

  const pkpass = await buildAccessTicketPkpass({
    ticketId: ticket.id,
    code: ticket.code,
    barcodeMessage: buildAccessVerifyUrl(token),
    event,
  });

  return new NextResponse(new Uint8Array(pkpass), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="pase.pkpass"`,
      "Cache-Control": "private, no-store",
    },
  });
}
