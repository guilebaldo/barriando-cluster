"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-utils";
import { isAdminUser } from "@/lib/admin";
import { listAdminAccessEvents, getAdminAccessEventById } from "@/lib/access-marketplace";
import type { AccessEventCard, AdminAccessEventDetail } from "@/lib/access-events";
import { BARRIANDO_PASE_HOST_EMAIL, BARRIANDO_PASE_HOST_ID, BARRIANDO_PASE_HOST_NAME, BARRIANDO_PASE_VENUE_LAT, BARRIANDO_PASE_VENUE_LNG, BARRIANDO_PASE_VENUE_NAME } from "@/lib/access-events";
import { parseMexicoCityLocalInput } from "@/lib/mexico-city-time";
import { resolveSocioMapCoord } from "@/lib/socio-map-coords";
import { sanitizeAccessDescription } from "@/lib/access-description";
import { composeBusinessAddress } from "@/lib/business-address";
import { parseHostNotifyEmails } from "@/lib/notify-access-ticket-sold";

type ActionResult = { ok: true } | { ok: false; error: string };

export type AccessEventHostOption = {
  id: number;
  name: string;
  category: string;
  latitude: number | null;
  longitude: number | null;
  email: string | null;
  /** Dirección comercial dada de alta (calle), si existe. */
  address: string | null;
};

const accessEventSchema = z.object({
  title: z.string().trim().min(1, "Falta el título.").max(160),
  description: z.string().max(8000).optional().default(""),
  venue: z.string().trim().min(1, "Falta la dirección.").max(240),
  hostId: z.string().nullable().optional(),
  venueId: z.string().nullable().optional(),
  hostEmail: z.string().trim().max(500).optional().default(""),
  coverUrl: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (v ?? "").trim())
    .pipe(z.string().max(500)),
  latitude: z.number().finite().nullable().optional(),
  longitude: z.number().finite().nullable().optional(),
  startsAt: z.string().trim().min(1, "Falta la fecha de inicio."),
  endsAt: z.string().nullable().optional(),
  priceMxn: z.string().trim().min(1, "Falta el precio."),
  capacity: z.string().nullable().optional(),
  published: z.boolean().optional(),
});

function parsePriceCents(raw: string): number | null {
  const normalized = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const pesos = Number(normalized);
  if (!Number.isFinite(pesos) || pesos < 0) return null;
  return Math.round(pesos * 100);
}

function parseOptionalInt(raw: string | null | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw.trim());
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function parseOptionalCatalogId(raw: string | null | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw.trim());
  if (!Number.isInteger(n)) return null;
  if (n === BARRIANDO_PASE_HOST_ID) return n;
  if (n < 1) return null;
  return n;
}

function parseOptionalCoverUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim() ?? "";
  if (!value) return null;
  if (value.length > 500) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return value;
  return `/${value}`;
}

function parseOptionalHostEmails(raw: string | null | undefined): string | null {
  const emails = parseHostNotifyEmails(raw);
  return emails.length > 0 ? emails.join(", ") : null;
}

function hostEmailsInputIsValid(raw: string | null | undefined): boolean {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return true;
  const parts = trimmed.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return true;
  return parseHostNotifyEmails(trimmed).length === parts.length;
}

function revalidatePasePaths(eventId: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/pases/${eventId}`);
  revalidatePath("/pases");
  revalidatePath("/pases/mios");
  revalidatePath(`/pases/${eventId}`);
  revalidatePath("/barrid");
}

async function requireAdmin() {
  const session = await requireSession();
  if (!isAdminUser(session)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function listAccessEventsForAdmin(): Promise<AccessEventCard[]> {
  await requireAdmin();
  return listAdminAccessEvents();
}

export async function getAccessEventForAdmin(
  eventId: string
): Promise<AdminAccessEventDetail | null> {
  await requireAdmin();
  return getAdminAccessEventById(eventId);
}

export async function listAccessEventHosts(): Promise<AccessEventHostOption[]> {
  await requireAdmin();
  const { getPublicSociosList } = await import("@/lib/public-socios");
  const socios = await getPublicSociosList();
  const socioIds = socios.map((socio) => socio.id);
  const users =
    socioIds.length > 0
      ? await prisma.user.findMany({
          where: { socioId: { in: socioIds } },
          select: {
            socioId: true,
            email: true,
            socioProfile: {
              select: {
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
        })
      : [];
  const emailBySocioId = new Map<number, string>();
  const addressBySocioId = new Map<number, string>();
  for (const user of users) {
    if (user.socioId == null) continue;
    if (user.email && !emailBySocioId.has(user.socioId)) {
      emailBySocioId.set(user.socioId, user.email);
    }
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
    if (address && !addressBySocioId.has(user.socioId)) {
      addressBySocioId.set(user.socioId, address);
    }
  }
  const sociosRows = socios
    .map((socio) => {
      const coord = resolveSocioMapCoord(socio);
      return {
        id: socio.id,
        name: socio.name,
        category: socio.categoria,
        latitude: coord?.lat ?? null,
        longitude: coord?.lng ?? null,
        email: emailBySocioId.get(socio.id) ?? null,
        address: addressBySocioId.get(socio.id) ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  return [
    {
      id: BARRIANDO_PASE_HOST_ID,
      name: BARRIANDO_PASE_HOST_NAME,
      category: "Clúster",
      latitude: BARRIANDO_PASE_VENUE_LAT,
      longitude: BARRIANDO_PASE_VENUE_LNG,
      email: BARRIANDO_PASE_HOST_EMAIL,
      address: BARRIANDO_PASE_VENUE_NAME,
    },
    ...sociosRows,
  ];
}

export async function createAccessEvent(
  input: z.infer<typeof accessEventSchema>
): Promise<ActionResult & { id?: string }> {
  try {
    await requireAdmin();
    const parsed = accessEventSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }
    const priceCents = parsePriceCents(parsed.data.priceMxn);
    if (priceCents == null) {
      return { ok: false, error: "El precio no es válido." };
    }
    const startsAt = parseMexicoCityLocalInput(parsed.data.startsAt);
    if (!startsAt) {
      return { ok: false, error: "La fecha de inicio no es válida." };
    }
    const endsAtRaw = parsed.data.endsAt?.trim();
    const endsAt = endsAtRaw ? parseMexicoCityLocalInput(endsAtRaw) : null;
    if (endsAtRaw && !endsAt) {
      return { ok: false, error: "La fecha de cierre no es válida." };
    }
    const capacity = parseOptionalInt(parsed.data.capacity);
    if (parsed.data.capacity?.trim() && capacity == null) {
      return { ok: false, error: "El cupo debe ser un número entero." };
    }
    const latitude = parsed.data.latitude ?? null;
    const longitude = parsed.data.longitude ?? null;
    if ((latitude == null) !== (longitude == null)) {
      return { ok: false, error: "Marca el lugar en el mapa (latitud y longitud juntas)." };
    }
    const hostEmailRaw = parsed.data.hostEmail?.trim() ?? "";
    if (!hostEmailsInputIsValid(hostEmailRaw)) {
      return {
        ok: false,
        error: "Revisa los correos del responsable (separa varios con coma).",
      };
    }

    const row = await prisma.accessEvent.create({
      data: {
        title: parsed.data.title,
        description: sanitizeAccessDescription(parsed.data.description ?? ""),
        venue: parsed.data.venue,
        hostId: parseOptionalCatalogId(parsed.data.hostId),
        venueId: parseOptionalCatalogId(parsed.data.venueId),
        hostEmail: parseOptionalHostEmails(hostEmailRaw),
        coverUrl: parseOptionalCoverUrl(parsed.data.coverUrl),
        latitude,
        longitude,
        startsAt,
        endsAt,
        priceCents,
        capacity,
        published: Boolean(parsed.data.published),
      },
    });
    revalidatePasePaths(row.id);
    return { ok: true, id: row.id };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { ok: false, error: "No autorizado." };
    }
    return { ok: false, error: "No se pudo crear el pase." };
  }
}

export async function updateAccessEvent(
  id: string,
  input: z.infer<typeof accessEventSchema>
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = accessEventSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }
    const priceCents = parsePriceCents(parsed.data.priceMxn);
    if (priceCents == null) {
      return { ok: false, error: "El precio no es válido." };
    }
    const startsAt = parseMexicoCityLocalInput(parsed.data.startsAt);
    if (!startsAt) {
      return { ok: false, error: "La fecha de inicio no es válida." };
    }
    const endsAtRaw = parsed.data.endsAt?.trim();
    const endsAt = endsAtRaw ? parseMexicoCityLocalInput(endsAtRaw) : null;
    if (endsAtRaw && !endsAt) {
      return { ok: false, error: "La fecha de cierre no es válida." };
    }
    const capacity = parseOptionalInt(parsed.data.capacity);
    if (parsed.data.capacity?.trim() && capacity == null) {
      return { ok: false, error: "El cupo debe ser un número entero." };
    }
    const latitude = parsed.data.latitude ?? null;
    const longitude = parsed.data.longitude ?? null;
    if ((latitude == null) !== (longitude == null)) {
      return { ok: false, error: "Marca el lugar en el mapa (latitud y longitud juntas)." };
    }
    const hostEmailRaw = parsed.data.hostEmail?.trim() ?? "";
    if (!hostEmailsInputIsValid(hostEmailRaw)) {
      return {
        ok: false,
        error: "Revisa los correos del responsable (separa varios con coma).",
      };
    }

    await prisma.accessEvent.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: sanitizeAccessDescription(parsed.data.description ?? ""),
        venue: parsed.data.venue,
        hostId: parseOptionalCatalogId(parsed.data.hostId),
        venueId: parseOptionalCatalogId(parsed.data.venueId),
        hostEmail: parseOptionalHostEmails(hostEmailRaw),
        coverUrl: parseOptionalCoverUrl(parsed.data.coverUrl),
        latitude,
        longitude,
        startsAt,
        endsAt,
        priceCents,
        capacity,
        published: Boolean(parsed.data.published),
      },
    });
    revalidatePasePaths(id);
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { ok: false, error: "No autorizado." };
    }
    return { ok: false, error: "No se pudo guardar el pase." };
  }
}

export async function toggleAccessEventPublished(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const row = await prisma.accessEvent.findUnique({ where: { id }, select: { published: true } });
    if (!row) return { ok: false, error: "Pase no encontrado." };
    await prisma.accessEvent.update({
      where: { id },
      data: { published: !row.published },
    });
    revalidatePasePaths(id);
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { ok: false, error: "No autorizado." };
    }
    return { ok: false, error: "No se pudo cambiar la publicación." };
  }
}

export async function deleteAccessEvent(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const sold = await prisma.accessTicket.count({ where: { eventId: id } });
    if (sold > 0) {
      return { ok: false, error: "No se puede borrar: ya hay boletos emitidos. Despublícalo." };
    }
    await prisma.ticketOrder.deleteMany({ where: { eventId: id } });
    await prisma.accessEvent.delete({ where: { id } });
    revalidatePasePaths(id);
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { ok: false, error: "No autorizado." };
    }
    return { ok: false, error: "No se pudo eliminar el pase." };
  }
}
