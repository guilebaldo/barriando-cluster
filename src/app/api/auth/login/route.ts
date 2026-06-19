import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { secureError, secureJson } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return secureError("Credenciales incorrectas", 401);

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) return secureError("Credenciales incorrectas", 401);

    await createSession({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
      socioId: user.socioId,
    });

    return secureJson({ ok: true, user: { id: user.id, email: user.email, nombre: user.nombre } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return secureError(error.issues[0]?.message ?? "Datos inválidos", 400);
    }
    return secureError("Error al iniciar sesión", 500);
  }
}
