import { secureError } from "@/lib/api";

/** Registro por contraseña deshabilitado: la app usa Google OAuth y magic link. */
export async function POST() {
  return secureError(
    "El registro con contraseña no está disponible. Usa Google o el enlace por correo en /login.",
    403
  );
}
