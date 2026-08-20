import { formatMexicoCityWhen, mexicoCityDateParts } from "@/lib/mexico-city-time";

export type AccessEventCard = {
  id: string;
  title: string;
  description: string;
  venue: string;
  latitude: number | null;
  longitude: number | null;
  hostId: number | null;
  venueId: number | null;
  hostEmail: string | null;
  /** Nombre visible del organizador / anfitrión. */
  hostName: string | null;
  startsAt: string;
  endsAt: string | null;
  priceCents: number;
  capacity: number | null;
  soldCount: number;
  published: boolean;
  /** Imagen pública para preview al compartir (WhatsApp / OG). Ruta o URL absoluta. */
  coverUrl: string | null;
  /** Link de Google Maps de la sede (negocio registrado), si hay. */
  mapsUrl: string | null;
  /** Nombre del socio sede (venueId); null si el lugar es libre / virtual. */
  venueName: string | null;
  /** Dirección postal completa del socio sede (colonia, municipio, etc.). */
  venueAddress: string | null;
};

/** Lugar corto en la lista: nombre de sede, o dirección/link si no hay sede. */
export function accessEventListPlace(
  event: Pick<AccessEventCard, "venueName" | "venue">
): string {
  return event.venueName?.trim() || event.venue.trim();
}

/**
 * Detalle en ficha: nombre de sede + dirección postal (o notas / Zoom).
 * Prefiere la dirección estructurada del socio (colonia, municipio…) sobre
 * un `venue` corto tipo solo calle y número.
 */
export function accessEventDetailPlace(
  event: Pick<AccessEventCard, "venueName" | "venue" | "venueAddress">
): {
  name: string | null;
  detail: string | null;
} {
  const name = event.venueName?.trim() || null;
  const postal = event.venueAddress?.trim() || null;
  const free = event.venue.trim() || null;
  let detail: string | null = postal || free;
  if (postal && free && free !== postal) {
    const freeLower = free.toLowerCase();
    const postalLower = postal.toLowerCase();
    const freeIsPrefixOfPostal =
      postalLower.startsWith(freeLower) || postalLower.includes(freeLower);
    if (!freeIsPrefixOfPostal && free !== name) {
      detail = `${postal} · ${free}`;
    }
  }
  if (name && detail && detail !== name) return { name, detail };
  if (name) return { name, detail: null };
  return { name: null, detail };
}

export function accessEventHasMapPin(
  event: Pick<AccessEventCard, "latitude" | "longitude" | "mapsUrl">
): boolean {
  const hasCoords =
    event.latitude != null &&
    event.longitude != null &&
    Number.isFinite(event.latitude) &&
    Number.isFinite(event.longitude);
  const hasMaps = Boolean(event.mapsUrl?.trim() && /^https?:\/\//i.test(event.mapsUrl.trim()));
  return hasCoords || hasMaps;
}

/** Organizador sintético: el Clúster (no es un socio del directorio). */
export const BARRIANDO_PASE_HOST_ID = -1;
export const BARRIANDO_PASE_HOST_EMAIL = "clusterturistico.pue@gmail.com";
export const BARRIANDO_PASE_HOST_NAME = "Barriando";
/** Pin / texto por defecto si la sede es el Clúster. */
export const BARRIANDO_PASE_VENUE_NAME = "Centro Histórico de Puebla";
export const BARRIANDO_PASE_VENUE_LAT = 19.043;
export const BARRIANDO_PASE_VENUE_LNG = -98.198;

export type AccessAttendanceStatus = "on_time" | "late" | "no_show";

export const ACCESS_ATTENDANCE_LABEL: Record<AccessAttendanceStatus, string> = {
  on_time: "A tiempo",
  late: "Tarde",
  no_show: "No llegó",
};

export const ACCESS_ATTENDANCE_COLOR: Record<AccessAttendanceStatus, string> = {
  on_time: "#059669",
  late: "#d97706",
  no_show: "#94a3b8",
};

export function accessTicketAttendance(
  redeemedAt: string | null,
  startsAt: string
): AccessAttendanceStatus {
  if (!redeemedAt) return "no_show";
  return new Date(redeemedAt).getTime() <= new Date(startsAt).getTime() ? "on_time" : "late";
}

export type AdminAccessTicketRow = {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  redeemedAt: string | null;
  status: AccessAttendanceStatus;
};

export type AdminAccessEventDetail = AccessEventCard & {
  tickets: AdminAccessTicketRow[];
};

export type AccessTicketCard = {
  id: string;
  code: string;
  eventId: string;
  redeemedAt: string | null;
  event: {
    title: string;
    venue: string;
    latitude: number | null;
    longitude: number | null;
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

export function formatAccessWhen(
  startsAt: string,
  endsAt: string | null,
  options?: { style?: "short" | "long" }
): string {
  return formatMexicoCityWhen(startsAt, endsAt, options);
}

/** «por Barriando» / «por La Berenjena». */
export function formatAccessHostByline(hostName: string | null | undefined): string | null {
  const name = hostName?.trim();
  return name ? `por ${name}` : null;
}

/**
 * Estimado de asistencia a partir de pases emitidos (hasta 2 por persona).
 * Vacío si aún no hay boletos, para no ensuciar la lista.
 */
export function formatAccessGoingLabel(
  soldCount: number,
  options?: { ended?: boolean; capacity?: number | null }
): string | null {
  const ended = Boolean(options?.ended);
  const capacity = options?.capacity ?? null;
  if (soldCount <= 0) {
    if (capacity != null && !ended) return `Cupo ${capacity}`;
    return null;
  }
  if (ended) {
    return soldCount === 1 ? "1 pase" : `${soldCount} pases`;
  }
  if (capacity != null) {
    return `${soldCount} van · ${capacity} cupo`;
  }
  return soldCount === 1 ? "1 va" : `${soldCount} van`;
}

export function formatAccessScanTime(iso: string): string {
  const parts = mexicoCityDateParts(new Date(iso));
  return `${parts.day} ${parts.month} ${parts.time}`;
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

/** Día / mes (corto y largo) + hora (hora de Puebla). El badge amarillo usa short. */
export function formatAccessEventDateParts(startsAt: string): {
  weekday: string;
  weekdayShort: string;
  day: number;
  month: string;
  monthLong: string;
  time: string;
} {
  return mexicoCityDateParts(new Date(startsAt));
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
