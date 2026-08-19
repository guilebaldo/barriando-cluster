import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { getAppOrigin } from "@/lib/benefit-credential";
import { secureError } from "@/lib/api";
import { getOwnedAccessTicketForSave } from "@/lib/access-marketplace";
import {
  accessTicketIcsFilename,
  buildAccessTicketIcs,
} from "@/lib/access-ticket-save";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ ticketId: string }> }
) {
  const session = await getSession();
  if (!session) return secureError("Debes iniciar sesión.", 401);

  const { ticketId } = await context.params;
  const ticket = await getOwnedAccessTicketForSave(session.id, ticketId);
  if (!ticket) return secureError("No encontramos ese pase.", 404);

  const pageUrl = `${getAppOrigin()}/pases/mios`;
  const event = {
    title: ticket.event.title,
    venue: ticket.event.venue,
    latitude: ticket.event.latitude,
    longitude: ticket.event.longitude,
    startsAt: ticket.event.startsAt.toISOString(),
    endsAt: ticket.event.endsAt?.toISOString() ?? null,
  };
  const ics = buildAccessTicketIcs({
    ticketId: ticket.id,
    event,
    pageUrl,
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
