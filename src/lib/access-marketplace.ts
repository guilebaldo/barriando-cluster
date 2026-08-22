import { prisma } from "@/lib/prisma";
import type {
  AccessEventCard,
  AccessTicketCard,
  AdminAccessEventDetail,
  AdminAccessTicketRow,
} from "@/lib/access-events";
import {
  accessTicketAttendance,
  BARRIANDO_PASE_HOST_ID,
  BARRIANDO_PASE_HOST_NAME,
} from "@/lib/access-events";
import { listaSocios } from "@/app/data/socios";

function toEventCard(
  row: {
    id: string;
    title: string;
    description: string;
    venue: string;
    latitude: number | null;
    longitude: number | null;
    online: boolean;
    meetingUrl: string | null;
    hostId: number | null;
    venueId: number | null;
    hostEmail: string | null;
    startsAt: Date;
    endsAt: Date | null;
    priceCents: number;
    capacity: number | null;
    coverUrl: string | null;
    published: boolean;
    _count: { tickets: number };
  }
): AccessEventCard {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    venue: row.venue,
    latitude: row.latitude,
    longitude: row.longitude,
    online: Boolean(row.online),
    meetingUrl: row.meetingUrl,
    hostId: row.hostId,
    venueId: row.venueId,
    hostEmail: row.hostEmail,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    priceCents: row.priceCents,
    capacity: row.capacity,
    soldCount: row._count.tickets,
    published: row.published,
    coverUrl: row.coverUrl,
    mapsUrl: null,
    venueName: null,
    venueAddress: null,
    hostName: null,
  };
}

function httpMapsUrl(...candidates: Array<string | null | undefined>): string | null {
  for (const raw of candidates) {
    const value = raw?.trim();
    if (value && /^https?:\/\//i.test(value)) return value;
  }
  return null;
}

async function attachHostNames(cards: AccessEventCard[]): Promise<AccessEventCard[]> {
  const names = new Map<number, string>();
  const mapsBySocioId = new Map<number, string>();
  const addressBySocioId = new Map<number, string>();
  names.set(BARRIANDO_PASE_HOST_ID, BARRIANDO_PASE_HOST_NAME);
  for (const socio of listaSocios) {
    names.set(socio.id, socio.name);
    const maps = httpMapsUrl(socio.direccion);
    if (maps) mapsBySocioId.set(socio.id, maps);
  }
  try {
    const { getPublicSociosList } = await import("@/lib/public-socios");
    const publicList = await getPublicSociosList();
    for (const socio of publicList) {
      names.set(socio.id, socio.name);
      const maps = httpMapsUrl(socio.direccion);
      if (maps) mapsBySocioId.set(socio.id, maps);
    }
  } catch {
    // El catálogo estático alcanza si el roster no carga.
  }

  const venueIds = [
    ...new Set(
      cards
        .map((card) => card.venueId)
        .filter((id): id is number => id != null && id > 0)
    ),
  ];
  const missingMapsIds = venueIds.filter((id) => !mapsBySocioId.has(id));
  if (venueIds.length > 0) {
    try {
      const { composeBusinessAddress } = await import("@/lib/business-address");
      const [businesses, profiles] = await Promise.all([
        missingMapsIds.length > 0
          ? prisma.business.findMany({
              where: { id: { in: missingMapsIds } },
              select: { id: true, mapsUrl: true },
            })
          : Promise.resolve([] as Array<{ id: number; mapsUrl: string | null }>),
        prisma.user.findMany({
          where: { socioId: { in: venueIds } },
          select: {
            socioId: true,
            socioProfile: {
              select: {
                googleBusinessUrl: true,
                address: true,
                street: true,
                streetNumber: true,
                colonia: true,
                codigoPostal: true,
                municipio: true,
                estado: true,
                pais: true,
              },
            },
          },
        }),
      ]);
      for (const biz of businesses) {
        const maps = httpMapsUrl(biz.mapsUrl);
        if (maps) mapsBySocioId.set(biz.id, maps);
      }
      for (const user of profiles) {
        if (user.socioId == null) continue;
        if (!mapsBySocioId.has(user.socioId)) {
          const maps = httpMapsUrl(user.socioProfile?.googleBusinessUrl);
          if (maps) mapsBySocioId.set(user.socioId, maps);
        }
        if (addressBySocioId.has(user.socioId)) continue;
        const composed = composeBusinessAddress({
          street: user.socioProfile?.street ?? undefined,
          streetNumber: user.socioProfile?.streetNumber ?? undefined,
          colonia: user.socioProfile?.colonia ?? undefined,
          codigoPostal: user.socioProfile?.codigoPostal ?? undefined,
          municipio: user.socioProfile?.municipio ?? undefined,
          estado: user.socioProfile?.estado ?? undefined,
          pais: user.socioProfile?.pais ?? undefined,
        });
        const address = composed || user.socioProfile?.address?.trim() || "";
        if (address) addressBySocioId.set(user.socioId, address);
      }

      const stillMissing = venueIds.filter((id) => !addressBySocioId.has(id));
      if (stillMissing.length > 0) {
        const overrides = await prisma.catalogSocioOverride.findMany({
          where: { socioId: { in: stillMissing } },
          select: {
            socioId: true,
            address: true,
            street: true,
            streetNumber: true,
            colonia: true,
            codigoPostal: true,
            municipio: true,
            estado: true,
            pais: true,
          },
        });
        for (const override of overrides) {
          const composed = composeBusinessAddress({
            street: override.street ?? undefined,
            streetNumber: override.streetNumber ?? undefined,
            colonia: override.colonia ?? undefined,
            codigoPostal: override.codigoPostal ?? undefined,
            municipio: override.municipio ?? undefined,
            estado: override.estado ?? undefined,
            pais: override.pais ?? undefined,
          });
          const address = composed || override.address?.trim() || "";
          if (address) addressBySocioId.set(override.socioId, address);
        }
      }
    } catch {
      // Sin Business/perfil: se usa fallback de coordenadas en el mini mapa.
    }
  }

  return cards.map((card) => ({
    ...card,
    hostName: card.hostId != null ? names.get(card.hostId) ?? null : null,
    venueName: card.venueId != null ? names.get(card.venueId) ?? null : null,
    venueAddress:
      card.venueId != null ? addressBySocioId.get(card.venueId) ?? null : null,
    mapsUrl: card.venueId != null ? mapsBySocioId.get(card.venueId) ?? null : null,
  }));
}

export async function listPublishedAccessEvents(): Promise<AccessEventCard[]> {
  const rows = await prisma.accessEvent.findMany({
    where: { published: true },
    orderBy: { startsAt: "asc" },
    include: { _count: { select: { tickets: true } } },
  });
  return attachHostNames(
    rows.filter((row) => !row.title.startsWith("BarrioPASS")).map(toEventCard)
  );
}

export async function getPublishedAccessEventById(
  eventId: string
): Promise<AccessEventCard | null> {
  const row = await prisma.accessEvent.findFirst({
    where: { id: eventId, published: true },
    include: { _count: { select: { tickets: true } } },
  });
  return row ? (await attachHostNames([toEventCard(row)]))[0]! : null;
}

export async function getOwnedAccessTicketForSave(userId: string, ticketId: string) {
  return prisma.accessTicket.findFirst({
    where: { id: ticketId, userId },
    select: {
      id: true,
      code: true,
      userId: true,
      event: {
        select: {
          title: true,
          venue: true,
          latitude: true,
          longitude: true,
          startsAt: true,
          endsAt: true,
        },
      },
    },
  });
}

export async function listUserAccessTickets(userId: string): Promise<AccessTicketCard[]> {
  const rows = await prisma.accessTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      event: {
        select: {
          title: true,
          venue: true,
          latitude: true,
          longitude: true,
          startsAt: true,
          endsAt: true,
        },
      },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    eventId: row.eventId,
    redeemedAt: row.redeemedAt?.toISOString() ?? null,
    event: {
      title: row.event.title,
      venue: row.event.venue,
      latitude: row.event.latitude,
      longitude: row.event.longitude,
      startsAt: row.event.startsAt.toISOString(),
      endsAt: row.event.endsAt?.toISOString() ?? null,
    },
  }));
}

function holderDisplayName(nombre: string | null, email: string | null): string {
  return nombre?.trim() || email?.trim() || "Sin nombre";
}

export async function listAdminAccessEvents(): Promise<AccessEventCard[]> {
  const rows = await prisma.accessEvent.findMany({
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { tickets: true } } },
  });
  return attachHostNames(rows.map(toEventCard));
}

export async function getAdminAccessEventById(
  eventId: string
): Promise<AdminAccessEventDetail | null> {
  const row = await prisma.accessEvent.findUnique({
    where: { id: eventId },
    include: {
      _count: { select: { tickets: true } },
      tickets: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          redeemedAt: true,
          user: { select: { id: true, nombre: true, email: true } },
        },
      },
    },
  });
  if (!row) return null;
  const event = (await attachHostNames([toEventCard(row)]))[0]!;
  const tickets: AdminAccessTicketRow[] = row.tickets.map((ticket) => ({
    id: ticket.id,
    userId: ticket.user.id,
    name: holderDisplayName(ticket.user.nombre, ticket.user.email),
    email: ticket.user.email,
    redeemedAt: ticket.redeemedAt?.toISOString() ?? null,
    status: accessTicketAttendance(
      ticket.redeemedAt?.toISOString() ?? null,
      event.startsAt
    ),
  }));
  return { ...event, tickets };
}
