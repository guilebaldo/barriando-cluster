import { auth } from "@/auth";
import { isAdminUser } from "@/lib/admin";
import { getAdminPendingCounts } from "@/lib/admin-notifications";
import { secureError, secureJson } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Conteos de pendientes para badge del navbar ADMIN. */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !isAdminUser(session.user)) {
      return secureError("No autorizado.", 403);
    }

    const counts = await getAdminPendingCounts();
    return secureJson(counts);
  } catch (error) {
    console.error("[admin] notifications failed:", error);
    return secureError("No se pudo cargar notificaciones.", 500);
  }
}
