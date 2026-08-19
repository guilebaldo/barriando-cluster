import { formatMexicoCityLocalInput, MEXICO_CITY_TZ } from "@/lib/mexico-city-time";

export type AccessTicketSaveEvent = {
  title: string;
  venue: string;
  latitude: number | null;
  longitude: number | null;
  startsAt: string;
  endsAt: string | null;
};

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function icsFold(line: string): string {
  if (line.length <= 74) return line;
  const chunks = [line.slice(0, 74)];
  let rest = line.slice(74);
  while (rest.length) {
    chunks.push(` ${rest.slice(0, 73)}`);
    rest = rest.slice(73);
  }
  return chunks.join("\r\n");
}

function icsUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsLocalStamp(iso: string | Date): string {
  const local = formatMexicoCityLocalInput(iso);
  return `${local.replace(/[-:]/g, "")}00`;
}

function eventEnd(event: AccessTicketSaveEvent): Date {
  if (event.endsAt) {
    const end = new Date(event.endsAt);
    if (Number.isFinite(end.getTime()) && end.getTime() > new Date(event.startsAt).getTime()) {
      return end;
    }
  }
  return new Date(new Date(event.startsAt).getTime() + 2 * 60 * 60 * 1000);
}

/** ICS for Apple Calendar / Google Calendar / Outlook (iOS y Android). */
export function buildAccessTicketIcs(input: {
  ticketId: string;
  event: AccessTicketSaveEvent;
  pageUrl: string;
  alarmMinutes?: number;
}): string {
  const start = new Date(input.event.startsAt);
  const end = eventEnd(input.event);
  const geo =
    input.event.latitude != null && input.event.longitude != null
      ? `GEO:${input.event.latitude};${input.event.longitude}`
      : null;
  const description = `Pase Barriando. Muestra tu QR en la entrada.\n${input.pageUrl}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Barriando//Pases//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-TIMEZONE:${MEXICO_CITY_TZ}`,
    "BEGIN:VEVENT",
    `UID:pase-${input.ticketId}@barriando.org`,
    `DTSTAMP:${icsUtcStamp(new Date())}`,
    `DTSTART;TZID=${MEXICO_CITY_TZ}:${icsLocalStamp(start)}`,
    `DTEND;TZID=${MEXICO_CITY_TZ}:${icsLocalStamp(end)}`,
    `SUMMARY:${icsEscape(input.event.title)}`,
    `LOCATION:${icsEscape(input.event.venue)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `URL:${input.pageUrl}`,
  ];
  if (geo) lines.push(geo);
  if (input.alarmMinutes && input.alarmMinutes > 0) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsEscape(input.event.title)}`,
      `TRIGGER:-PT${input.alarmMinutes}M`,
      "END:VALARM"
    );
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(icsFold).join("\r\n") + "\r\n";
}

/** Google Calendar (Android / web); iOS abre Calendar con el .ics. */
export function googleCalendarUrl(event: AccessTicketSaveEvent, detailsUrl: string): string {
  const start = icsUtcStamp(new Date(event.startsAt));
  const end = icsUtcStamp(eventEnd(event));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    location: event.venue,
    details: `Pase Barriando. Muestra tu QR en la entrada.\n${detailsUrl}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function accessTicketIcsFilename(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `pase-${slug || "barriando"}.ics`;
}
