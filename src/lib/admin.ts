export const ADMIN_EMAIL = "guilebaldoruiz@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function isAdminUser(user: {
  email?: string | null;
  role?: string | null;
}): boolean {
  if (user.role === "ADMIN") return true;
  return isAdminEmail(user.email);
}
