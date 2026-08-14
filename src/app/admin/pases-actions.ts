"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-utils";
import { isAdminUser } from "@/lib/admin";
import { listAdminAccessEvents } from "@/lib/access-marketplace";
import type { AccessEventCard } from "@/lib/access-events";

type ActionResult = { ok: true } | { ok: false; error: string };

const accessEventSchema = z.object({
  title: z.string().trim().min(1, "Falta el título.").max(160),
  description: z.string().trim().max(2000).optional().default(""),
  venue: z.string().trim().min(1, "Falta el lugar.").max(200),
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
    const startsAt = new Date(parsed.data.startsAt);
    if (!Number.isFinite(startsAt.getTime())) {
      return { ok: false, error: "La fecha de inicio no es válida." };
    }
    const endsAtRaw = parsed.data.endsAt?.trim();
    const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;
    if (endsAt && !Number.isFinite(endsAt.getTime())) {
      return { ok: false, error: "La fecha de cierre no es válida." };
    }
    const capacity = parseOptionalInt(parsed.data.capacity);
    if (parsed.data.capacity?.trim() && capacity == null) {
      return { ok: false, error: "El cupo debe ser un número entero." };
    }

    const row = await prisma.accessEvent.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        venue: parsed.data.venue,
        startsAt,
        endsAt,
        priceCents,
        capacity,
        published: Boolean(parsed.data.published),
      },
    });
    revalidatePath("/admin");
    revalidatePath("/pases");
    revalidatePath("/pases/mios");
    revalidatePath(`/pases/${row.id}`);
    revalidatePath("/barrid");
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
    const startsAt = new Date(parsed.data.startsAt);
    if (!Number.isFinite(startsAt.getTime())) {
      return { ok: false, error: "La fecha de inicio no es válida." };
    }
    const endsAtRaw = parsed.data.endsAt?.trim();
    const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;
    if (endsAt && !Number.isFinite(endsAt.getTime())) {
      return { ok: false, error: "La fecha de cierre no es válida." };
    }
    const capacity = parseOptionalInt(parsed.data.capacity);
    if (parsed.data.capacity?.trim() && capacity == null) {
      return { ok: false, error: "El cupo debe ser un número entero." };
    }

    await prisma.accessEvent.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        venue: parsed.data.venue,
        startsAt,
        endsAt,
        priceCents,
        capacity,
        published: Boolean(parsed.data.published),
      },
    });
    revalidatePath("/admin");
    revalidatePath("/pases");
    revalidatePath("/pases/mios");
    revalidatePath(`/pases/${id}`);
    revalidatePath("/barrid");
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
    revalidatePath("/admin");
    revalidatePath("/pases");
    revalidatePath("/pases/mios");
    revalidatePath(`/pases/${id}`);
    revalidatePath("/barrid");
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
    revalidatePath("/admin");
    revalidatePath("/pases");
    revalidatePath("/pases/mios");
    revalidatePath(`/pases/${id}`);
    revalidatePath("/barrid");
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
