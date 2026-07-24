/** Envío de correos vía Resend (API HTTP). */

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function resolveAppOrigin(): string {
  return (
    readEnv("NEXT_PUBLIC_APP_URL", "AUTH_URL", "NEXTAUTH_URL") || "https://barriando.org"
  ).replace(/\/$/, "");
}

export function getEmailFrom(): string {
  return readEnv("EMAIL_FROM", "AUTH_EMAIL_FROM") || "Barriando <noreply@barriando.org>";
}

export function getResendApiKey(): string | undefined {
  return readEnv("RESEND_API_KEY", "AUTH_RESEND_KEY");
}

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Idempotency / debugging tag in logs */
  tags?: string[];
};

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; skipped?: boolean };

/**
 * Envía un correo con Resend. No lanza: el caller decide si fallar el flujo.
 * Si falta RESEND_API_KEY, retorna skipped (útil en local / preview).
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY ausente; correo no enviado:", params.subject);
    return { ok: false, error: "RESEND_API_KEY missing", skipped: true };
  }

  const to = params.to.trim().toLowerCase();
  if (!to || !to.includes("@")) {
    return { ok: false, error: "Invalid recipient" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getEmailFrom(),
        to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        ...(params.tags?.length
          ? { tags: params.tags.map((name) => ({ name, value: "true" })) }
          : {}),
      }),
    });

    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };

    if (!res.ok) {
      const error = body.message || JSON.stringify(body);
      console.error("[email] Resend failed:", error);
      return { ok: false, error };
    }

    console.info("[email] sent:", {
      to,
      subject: params.subject,
      id: body.id,
      tags: params.tags,
    });
    return { ok: true, id: body.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "send failed";
    console.error("[email] send exception:", message);
    return { ok: false, error: message };
  }
}
