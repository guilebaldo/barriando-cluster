import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { secureError, secureJson } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  nombre: z.string().min(2, "Nombre requerido"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return secureError("Ya existe una cuenta con este correo", 409);

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        nombre: data.nombre,
        subscription: {
          create: {
            plan: "VECINO",
            status: "inactive",
          },
        },
      },
    });

    return secureJson({
      ok: true,
      welcome: "¡Ya eres Barrio!",
      user: { id: user.id, email: user.email, nombre: user.nombre },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return secureError(error.issues[0]?.message ?? "Datos inválidos", 400);
    }
    return secureError("Error al registrar la cuenta", 500);
  }
}
