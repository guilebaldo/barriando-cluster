const DEFAULT_ADMIN_EMAIL = "guilebaldoruiz@gmail.com";

function parseAdminEmails(): string[] {
  const raw =
    process.env.ADMIN_EMAILS?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    DEFAULT_ADMIN_EMAIL;
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

const ADMIN_EMAILS = parseAdminEmails();

/** @deprecated Prefer isAdminUser(); kept for callers that import the constant. */
export const ADMIN_EMAIL = ADMIN_EMAILS[0] ?? DEFAULT_ADMIN_EMAIL;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export function isAdminUser(user: {
  email?: string | null;
  role?: string | null;
}): boolean {
  if (user.role === "ADMIN") return true;
  return isAdminEmail(user.email);
}
