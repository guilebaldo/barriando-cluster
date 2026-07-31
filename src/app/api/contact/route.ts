import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { secureError, secureJson } from "@/lib/api";
import { clientIpFromRequest, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Correo inválido"),
  mensaje: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

export async function POST(request: NextRequest) {
  try {
    const ip = clientIpFromRequest(request);
    const ipLimit = await rateLimit({
      bucketKey: `contact:ip:${ip}`,
      limit: 8,
      windowSeconds: 60 * 60,
    });
    if (!ipLimit.ok) {
      return secureError("Demasiados mensajes desde esta red. Intenta más tarde.", 429);
    }

    const body = await request.json();
    const data = schema.parse(body);

    const emailLimit = await rateLimit({
      bucketKey: `contact:email:${data.email.trim().toLowerCase()}`,
      limit: 5,
      windowSeconds: 60 * 60,
    });
    if (!emailLimit.ok) {
      return secureError("Demasiados mensajes con este correo. Intenta más tarde.", 429);
    }

    const message = await prisma.contactMessage.create({ data });

    return secureJson({ ok: true, id: message.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return secureError(error.issues[0]?.message ?? "Datos inválidos", 400);
    }
    return secureError("No se pudo enviar el mensaje. Intenta de nuevo.", 500);
  }
}
