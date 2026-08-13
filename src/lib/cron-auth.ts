import { secureError } from "@/lib/api";

/** Vercel Cron envía `Authorization: Bearer $CRON_SECRET`. */
export function authorizeCron(request: Request): Response | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return secureError("CRON_SECRET no configurado.", 503);
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return secureError("No autorizado.", 401);
  }
  return null;
}
