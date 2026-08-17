import { prisma } from "@/lib/prisma";
import type {
  AccessEventCard,
  AccessEventHolder,
  AccessTicketCard,
  AdminAccessEventCard,
} from "@/lib/access-events";

function toEventCard(
  row: {
    id: string;
    title: string;
    description: string;
    venue: string;
    latitude: number | null;
    longitude: number | null;
    startsAt: Date;
    endsAt: Date | null;
    priceCents: number;
    capacity: number | null;
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
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    priceCents: row.priceCents,
    capacity: row.capacity,
    soldCount: row._count.tickets,
    published: row.published,
  };
}

export async function listPublishedAccessEvents(): Promise<AccessEventCard[]> {
  const rows = await prisma.accessEvent.findMany({
    where: { published: true },
    orderBy: { startsAt: "asc" },
    include: { _count: { select: { tickets: true } } },
  });
  return rows
    .filter((row) => !row.title.startsWith("BarrioPASS"))
    .map(toEventCard);
}

export async function getPublishedAccessEventById(
  eventId: string
): Promise<AccessEventCard | null> {
  const row = await prisma.accessEvent.findFirst({
    where: { id: eventId, published: true },
    include: { _count: { select: { tickets: true } } },
  });
  return row ? toEventCard(row) : null;
}

export async function listUserAccessTickets(userId: string): Promise<AccessTicketCard[]> {
  const rows = await prisma.accessTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      event: { select: { title: true, venue: true, startsAt: true, endsAt: true } },
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
      startsAt: row.event.startsAt.toISOString(),
      endsAt: row.event.endsAt?.toISOString() ?? null,
    },
  }));
}

function holderDisplayName(nombre: string | null, email: string | null): string {
  return nombre?.trim() || email?.trim() || "Sin nombre";
}

function toAdminEventCard(
  row: {
    id: string;
    title: string;
    description: string;
    venue: string;
    latitude: number | null;
    longitude: number | null;
    startsAt: Date;
    endsAt: Date | null;
    priceCents: number;
    capacity: number | null;
    published: boolean;
    _count: { tickets: number };
    tickets: Array<{
      redeemedAt: Date | null;
      user: { id: string; nombre: string | null; email: string | null };
    }>;
  }
): AdminAccessEventCard {
  const byUser = new Map<string, AccessEventHolder>();
  for (const ticket of row.tickets) {
    const existing = byUser.get(ticket.user.id);
    if (existing) {
      existing.ticketCount += 1;
      if (ticket.redeemedAt) existing.redeemedCount += 1;
      continue;
    }
    byUser.set(ticket.user.id, {
      userId: ticket.user.id,
      name: holderDisplayName(ticket.user.nombre, ticket.user.email),
      email: ticket.user.email,
      ticketCount: 1,
      redeemedCount: ticket.redeemedAt ? 1 : 0,
    });
  }
  const holders = [...byUser.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  return { ...toEventCard(row), holders };
}

export async function listAdminAccessEvents(): Promise<AdminAccessEventCard[]> {
  const rows = await prisma.accessEvent.findMany({
    orderBy: { startsAt: "desc" },
    include: {
      _count: { select: { tickets: true } },
      tickets: {
        select: {
          redeemedAt: true,
          user: { select: { id: true, nombre: true, email: true } },
        },
      },
    },
  });
  return rows.map(toAdminEventCard);
}
