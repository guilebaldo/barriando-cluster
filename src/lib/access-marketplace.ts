import { prisma } from "@/lib/prisma";
import type {
  AccessEventCard,
  AccessTicketCard,
  AdminAccessEventDetail,
  AdminAccessTicketRow,
} from "@/lib/access-events";
import { accessTicketAttendance } from "@/lib/access-events";

function toEventCard(
  row: {
    id: string;
    title: string;
    description: string;
    venue: string;
    latitude: number | null;
    longitude: number | null;
    hostId: number | null;
    hostEmail: string | null;
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
    hostId: row.hostId,
    hostEmail: row.hostEmail,
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

export async function listAdminAccessEvents(): Promise<AccessEventCard[]> {
  const rows = await prisma.accessEvent.findMany({
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { tickets: true } } },
  });
  return rows.map(toEventCard);
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
  const event = toEventCard(row);
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
