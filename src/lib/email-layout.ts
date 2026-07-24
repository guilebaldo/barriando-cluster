import { resolveAppOrigin } from "@/lib/email";

const BRAND = "#27366D";
const BRAND_DEEP = "#1e2b58";
const ACCENT = "#f59e0b";

export type BrandedEmailContent = {
  /** Línea corta encima del título (ej. "Pago acreditado") */
  eyebrow: string;
  title: string;
  /** HTML seguro controlado por nosotros (párrafos, strong, etc.) */
  bodyHtml: string;
  /** Texto del botón CTA; si falta, no se muestra botón */
  ctaLabel?: string;
  ctaUrl?: string;
  /** Nota bajo el CTA (caja secundaria opcional) */
  asideHtml?: string;
  footerNote?: string;
  preheader?: string;
};

/** Shell HTML compartido (magic link, notificaciones, etc.). */
export function renderBrandedEmailHtml(content: BrandedEmailContent): string {
  const origin = resolveAppOrigin();
  const faviconUrl = `${origin}/logos/favicon.png`;
  const siteUrl = origin;
  const year = new Date().getFullYear();
  const footerNote =
    content.footerNote ||
    "Recibes este correo porque tienes una cuenta en Barriando.";

  const ctaBlock =
    content.ctaLabel && content.ctaUrl
      ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center" style="padding:0 0 28px;">
              <a href="${content.ctaUrl}"
                 style="display:inline-block;background:${BRAND};color:#ffffff;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:16px 36px;border-radius:10px;box-shadow:0 8px 20px rgba(39,54,109,0.28);">
                ${content.ctaLabel}
              </a>
            </td>
          </tr>
        </table>`
      : "";

  const asideBlock = content.asideHtml
    ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
        <tr>
          <td style="padding:14px 16px;">
            ${content.asideHtml}
          </td>
        </tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(content.title)} — Barriando</title>
</head>
<body style="margin:0;padding:0;background:#eef1f7;font-family:Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${
    content.preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(content.preheader)}</div>`
      : ""
  }
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#eef1f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;border-radius:16px;overflow:hidden;background:#ffffff;border:1px solid #d8dee9;box-shadow:0 12px 32px rgba(39,54,109,0.10);">
          <tr>
            <td style="background:${BRAND};background:linear-gradient(145deg, ${BRAND} 0%, ${BRAND_DEEP} 100%);padding:28px 32px;text-align:center;">
              <a href="${siteUrl}" style="text-decoration:none;display:inline-block;">
                <img
                  src="${faviconUrl}"
                  width="56"
                  height="56"
                  alt="Barriando"
                  style="display:block;margin:0 auto 14px;border:0;border-radius:12px;box-shadow:0 4px 14px rgba(0,0,0,0.22);"
                />
                <span style="display:block;font-size:13px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:#ffffff;">
                  Barriando
                </span>
              </a>
              <p style="margin:10px 0 0;font-size:11px;letter-spacing:0.06em;color:rgba(255,255,255,0.72);">
                Clúster Turístico · Centro Histórico de Puebla
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 28px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${ACCENT};">
                ${escapeHtml(content.eyebrow)}
              </p>
              <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:800;color:#0f172a;">
                ${escapeHtml(content.title)}
              </h1>
              <div style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#64748b;">
                ${content.bodyHtml}
              </div>
              ${ctaBlock}
              ${asideBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <div style="border-top:1px solid #e2e8f0;padding-top:20px;">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#94a3b8;">
                  ${escapeHtml(footerNote)}
                </p>
                <p style="margin:0;font-size:11px;color:#cbd5e1;">
                  © ${year} Barriando ·
                  <a href="${siteUrl}" style="color:#94a3b8;text-decoration:none;">barriando.org</a>
                </p>
              </div>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:11px;color:#94a3b8;text-align:center;">
          Enviado por Barriando · Asociación de Empresarios del Centro Histórico
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
