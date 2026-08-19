import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { secureError } from "@/lib/api";
import { getOwnedAccessTicketForSave } from "@/lib/access-marketplace";
import {
  AppleWalletNotConfiguredError,
  buildSignedAccessTicketPkpass,
  isAppleWalletConfigured,
} from "@/lib/access-ticket-pkpass";
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

  if (isAppleMobile(request) && !isAppleWalletConfigured()) {
    return secureError(
      "Passbook aún no está activo en el servidor. Usa Calendario mientras tanto.",
      503
    );
  }

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

  try {
    const pkpass = await buildSignedAccessTicketPkpass({
      ticketId: ticket.id,
      code: ticket.code,
      barcodeMessage: buildAccessVerifyUrl(token),
      event,
    });

    return new NextResponse(new Uint8Array(pkpass), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": 'attachment; filename="pase-barriando.pkpass"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof AppleWalletNotConfiguredError) {
      return secureError(
        "Passbook aún no está activo en el servidor. Usa Calendario mientras tanto.",
        503
      );
    }
    console.error("[wallet] pkpass build failed:", error);
    return secureError("No se pudo generar el pase para Wallet.", 500);
  }
}
