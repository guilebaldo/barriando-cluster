import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireSession, getUserWithSubscription } from "@/lib/auth-utils";
import { hasCommercialAccess } from "@/lib/membresia";
import { prisma } from "@/lib/prisma";
import { detectImageFromBytes } from "@/lib/image-bytes";
import { secureError, secureJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

const MAX_SIZE = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const uploadLimit = await rateLimit({
      bucketKey: `logo-upload:user:${session.id}`,
      limit: 10,
      windowSeconds: 60 * 60,
    });
    if (!uploadLimit.ok) {
      return secureError("Demasiadas subidas de logo. Intenta más tarde.", 429);
    }

    const user = await getUserWithSubscription(session.id);
    if (!user?.subscription || !hasCommercialAccess(user.subscription.plan, user.subscription.status)) {
      return secureError("Necesitas una membresía de pago activa para subir tu logo", 403);
    }
    if (!session.socioId) {
      return secureError("Tu cuenta no está vinculada a un negocio socio", 403);
    }

    const formData = await request.formData();
    const file = formData.get("logo");
    if (!file || !(file instanceof File)) {
      return secureError("Archivo de logo requerido", 400);
    }

    if (file.size > MAX_SIZE) {
      return secureError("El archivo no debe superar 2 MB", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectImageFromBytes(buffer);
    if (!detected) {
      return secureError("Formato no permitido. Usa PNG, JPG o WebP.", 400);
    }

    const logosDir = path.join(process.cwd(), "public", "logos");
    await mkdir(logosDir, { recursive: true });

    const filename = `upload-${session.id.slice(-12)}.${detected.ext}`;
    const publicPath = `/logos/${filename}`;
    await writeFile(path.join(logosDir, filename), buffer);

    await prisma.socioProfile.updateMany({
      where: { userId: session.id },
      data: { logoUrl: publicPath },
    });

    return secureJson({ ok: true, filename: publicPath });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return secureError("Debes iniciar sesión", 401);
    }
    return secureError("No se pudo subir el logo", 500);
  }
}
