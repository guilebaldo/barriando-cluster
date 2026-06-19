import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireSession } from "@/lib/auth";
import { listaSocios } from "@/app/data/socios";
import { secureError, secureJson } from "@/lib/api";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.socioId) {
      return secureError("Tu cuenta no está vinculada a un negocio socio", 403);
    }

    const socio = listaSocios.find((s) => s.id === session.socioId);
    if (!socio) return secureError("Socio no encontrado", 404);

    const formData = await request.formData();
    const file = formData.get("logo");
    if (!file || !(file instanceof File)) {
      return secureError("Archivo de logo requerido", 400);
    }

    if (!ALLOWED.includes(file.type)) {
      return secureError("Formato no permitido. Usa PNG, JPG o WebP.", 400);
    }
    if (file.size > MAX_SIZE) {
      return secureError("El archivo no debe superar 2 MB", 400);
    }

    const logosDir = path.join(process.cwd(), "public", "logos");
    await mkdir(logosDir, { recursive: true });

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filename = `${socio.foto}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(logosDir, filename), buffer);

    return secureJson({ ok: true, filename: `/logos/${filename}` });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return secureError("Debes iniciar sesión", 401);
    }
    return secureError("No se pudo subir el logo", 500);
  }
}
