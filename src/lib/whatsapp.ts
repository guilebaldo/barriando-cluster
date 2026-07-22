/** Digits-only WhatsApp phone, with MX country code when a 10-digit local number is given. */
export function normalizeWhatsAppPhone(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `52${digits}`;
  if (digits.length < 10) return null;
  return digits;
}

export function buildWhatsAppUrl(
  raw: string | null | undefined,
  text?: string,
): string | null {
  const phone = normalizeWhatsAppPhone(raw);
  if (!phone) return null;
  const url = new URL(`https://wa.me/${phone}`);
  const trimmed = text?.trim();
  if (trimmed) url.searchParams.set("text", trimmed);
  return url.toString();
}

/** Prefer contact WhatsApp, then business phone, then billing WhatsApp. */
export function resolveProfileWhatsApp(profile: {
  contactWhatsapp?: string | null;
  phone?: string | null;
  billingWhatsapp?: string | null;
} | null | undefined): string | null {
  if (!profile) return null;
  return (
    profile.contactWhatsapp?.trim() ||
    profile.phone?.trim() ||
    profile.billingWhatsapp?.trim() ||
    null
  );
}
