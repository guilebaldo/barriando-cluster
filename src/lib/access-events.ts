export type AccessEventCard = {
  id: string;
  title: string;
  description: string;
  venue: string;
  latitude: number | null;
  longitude: number | null;
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
  const startLabel = start
    .toLocaleString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/\./g, "");
  if (!endsAt) return startLabel;
  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  const endLabel = end
    .toLocaleString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      ...(sameDay ? {} : { day: "numeric", month: "short" }),
    })
    .replace(/\./g, "");
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

/** Día de la semana + número + mes abreviado + hora (lista / ficha). */
export function formatAccessEventDateParts(startsAt: string): {
  weekday: string;
  day: number;
  month: string;
  time: string;
} {
  const d = new Date(startsAt);
  const weekdayRaw = d.toLocaleDateString("es-MX", { weekday: "long" });
  const monthRaw = d.toLocaleDateString("es-MX", { month: "short" }).replace(/\./g, "");
  const time = d
    .toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
    .replace(/\./g, "");
  return {
    weekday: capitalizeEs(weekdayRaw),
    day: d.getDate(),
    month: capitalizeEs(monthRaw),
    time,
  };
}

function capitalizeEs(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("es-MX") + value.slice(1);
}

export type AccessEventHorizon = "hoy" | "7d" | "30d" | "1y" | "despues" | "finalizados";

export const ACCESS_EVENT_HORIZON_ORDER: AccessEventHorizon[] = [
  "hoy",
  "7d",
  "30d",
  "1y",
  "despues",
  "finalizados",
];

export const ACCESS_EVENT_HORIZON_LABEL: Record<AccessEventHorizon, string> = {
  hoy: "Hoy",
  "7d": "En 7 días",
  "30d": "En 30 días",
  "1y": "En 1 año",
  despues: "Más adelante",
  finalizados: "Finalizados",
};

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Buckets exclusivos: hoy → 7d → 30d → 1y → más adelante / finalizados. */
export function accessEventHorizon(
  event: Pick<AccessEventCard, "startsAt" | "endsAt">,
  now = new Date()
): AccessEventHorizon {
  if (accessEventHasEnded(event.startsAt, event.endsAt, now.getTime())) {
    return "finalizados";
  }
  const start = startOfLocalDay(new Date(event.startsAt));
  const today = startOfLocalDay(now);
  const days = Math.round((start.getTime() - today.getTime()) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days <= 7) return "7d";
  if (days <= 30) return "30d";
  if (days <= 365) return "1y";
  return "despues";
}

export function groupAccessEventsByHorizon(
  events: AccessEventCard[],
  now = new Date()
): Array<{ horizon: AccessEventHorizon; label: string; events: AccessEventCard[] }> {
  const buckets = new Map<AccessEventHorizon, AccessEventCard[]>();
  for (const horizon of ACCESS_EVENT_HORIZON_ORDER) {
    buckets.set(horizon, []);
  }
  const sorted = [...events].sort((a, b) => {
    const aEnded = accessEventHasEnded(a.startsAt, a.endsAt, now.getTime());
    const bEnded = accessEventHasEnded(b.startsAt, b.endsAt, now.getTime());
    if (aEnded !== bEnded) return aEnded ? 1 : -1;
    const diff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    return aEnded ? -diff : diff;
  });
  for (const event of sorted) {
    buckets.get(accessEventHorizon(event, now))!.push(event);
  }
  return ACCESS_EVENT_HORIZON_ORDER.filter((horizon) => (buckets.get(horizon)?.length ?? 0) > 0).map(
    (horizon) => ({
      horizon,
      label: ACCESS_EVENT_HORIZON_LABEL[horizon],
      events: buckets.get(horizon)!,
    })
  );
}
