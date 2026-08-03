/**
 * Acceso admin:
 * 1) `User.role === "ADMIN"` en la base (fuente viva vía JWT enrich).
 * 2) Lista opcional `ADMIN_EMAILS` / `ADMIN_EMAIL` como llave de emergencia.
 *
 * No hay fallback quemado en el código: en producción configura ADMIN_EMAILS
 * en Vercel y asegúrate de que tu usuario tenga role=ADMIN en Neon.
 */
function parseAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim() || process.env.ADMIN_EMAIL?.trim() || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

const ADMIN_EMAILS = parseAdminEmails();

/** Primer correo de ADMIN_EMAILS, o vacío si no hay variable. */
export const ADMIN_EMAIL = ADMIN_EMAILS[0] ?? "";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email?.trim() || ADMIN_EMAILS.length === 0) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export function isAdminUser(user: {
  email?: string | null;
  role?: string | null;
}): boolean {
  if (user.role === "ADMIN") return true;
  return isAdminEmail(user.email);
}
