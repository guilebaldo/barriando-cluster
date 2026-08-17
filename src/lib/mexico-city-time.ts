/** Puebla / Centro Histórico: hora de muro de los pases. */
export const MEXICO_CITY_TZ = "America/Mexico_City";

/** Offset (ms) of `timeZone` at `date`: tzLocalAsUTC - instant. */
function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - date.getTime();
}

/**
 * `datetime-local` (YYYY-MM-DDTHH:mm) → Instant, treating the wall clock as
 * America/Mexico_City. `new Date("2026-08-16T19:00")` on Vercel is UTC 19:00,
 * which then shows as 13:00 in Puebla.
 */
export function parseMexicoCityLocalInput(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null;

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  let date = new Date(utcGuess);
  const offset = timeZoneOffsetMs(date, MEXICO_CITY_TZ);
  date = new Date(utcGuess - offset);
  const offset2 = timeZoneOffsetMs(date, MEXICO_CITY_TZ);
  if (offset2 !== offset) date = new Date(utcGuess - offset2);
  return Number.isFinite(date.getTime()) ? date : null;
}

/** Instant → `datetime-local` string in America/Mexico_City. */
export function formatMexicoCityLocalInput(iso: string | Date | null): string {
  if (!iso) return "";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (!Number.isFinite(date.getTime())) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: MEXICO_CITY_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function mexicoCityDateParts(date: Date): {
  weekday: string;
  weekdayShort: string;
  day: number;
  month: string;
  time: string;
} {
  const weekdayRaw = date.toLocaleDateString("es-MX", {
    timeZone: MEXICO_CITY_TZ,
    weekday: "long",
  });
  const weekdayShortRaw = date
    .toLocaleDateString("es-MX", { timeZone: MEXICO_CITY_TZ, weekday: "short" })
    .replace(/\./g, "");
  const monthRaw = date
    .toLocaleDateString("es-MX", { timeZone: MEXICO_CITY_TZ, month: "short" })
    .replace(/\./g, "");
  const dayRaw = date.toLocaleDateString("es-MX", {
    timeZone: MEXICO_CITY_TZ,
    day: "numeric",
  });
  const time = date
    .toLocaleTimeString("es-MX", {
      timeZone: MEXICO_CITY_TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/\./g, "");
  return {
    weekday: capitalizeEs(weekdayRaw),
    weekdayShort: capitalizeEs(weekdayShortRaw),
    day: Number(dayRaw),
    month: capitalizeEs(monthRaw),
    time,
  };
}

function capitalizeEs(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("es-MX") + value.slice(1);
}

export function formatMexicoCityWhen(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  const startParts = mexicoCityDateParts(start);
  const startLabel = `${startParts.weekdayShort} ${startParts.day} ${startParts.month} ${startParts.time}`;
  if (!endsAt) return startLabel;
  const end = new Date(endsAt);
  const endParts = mexicoCityDateParts(end);
  const sameDay =
    formatMexicoCityLocalInput(start).slice(0, 10) === formatMexicoCityLocalInput(end).slice(0, 10);
  const endLabel = sameDay ? endParts.time : `${endParts.day} ${endParts.month} ${endParts.time}`;
  return `${startLabel} – ${endLabel}`;
}
