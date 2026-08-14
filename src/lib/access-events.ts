export type AccessEventCard = {
  id: string;
  title: string;
  description: string;
  venue: string;
  startsAt: string;
  endsAt: string | null;
  priceCents: number;
  capacity: number | null;
  soldCount: number;
  published: boolean;
};

export type AccessTicketCard = {
  id: string;
  code: string;
  eventId: string;
  redeemedAt: string | null;
  event: {
    title: string;
    venue: string;
    startsAt: string;
    endsAt: string | null;
  };
};

export function formatAccessPriceMxn(priceCents: number): string {
  if (priceCents <= 0) return "Cortesía";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(priceCents / 100);
}

export function formatAccessWhen(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  const startLabel = start.toLocaleString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  if (!endsAt) return startLabel;
  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  const endLabel = end.toLocaleString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    ...(sameDay ? {} : { day: "numeric", month: "short" }),
  });
  return `${startLabel} – ${endLabel}`;
}

export function accessEventHasEnded(startsAt: string, endsAt: string | null, now = Date.now()): boolean {
  const close = endsAt ? new Date(endsAt).getTime() : new Date(startsAt).getTime();
  return Number.isFinite(close) && close < now;
}

export function accessEventIsSoldOut(capacity: number | null, soldCount: number): boolean {
  return capacity != null && soldCount >= capacity;
}

/** Ruta pública compartible de un pase. */
export function accessEventPublicPath(eventId: string): string {
  return `/pases/${eventId}`;
}
