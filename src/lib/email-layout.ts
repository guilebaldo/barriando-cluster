import { BRAND_LOGO_CID, resolveAppOrigin } from "@/lib/email";

const BRAND = "#27366D";
const ACCENT = "#b45309";

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

/**
 * Shell HTML compartido (verificación por correo, notificaciones).
 * Wordmark de navbar embebido vía CID (no URL remota).
 */
export function renderBrandedEmailHtml(content: BrandedEmailContent): string {
  const siteUrl = resolveAppOrigin();
  const year = new Date().getFullYear();
  const footerNote =
    content.footerNote ||
    "Recibes este correo porque tienes una cuenta en Barriando.";

  const ctaBlock =
    content.ctaLabel && content.ctaUrl
      ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <a href="${content.ctaUrl}"
                 bgcolor="${BRAND}"
                 style="display:inline-block;background-color:${BRAND};background:${BRAND};color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:6px;">
                ${escapeHtml(content.ctaLabel)}
              </a>
            </td>
          </tr>
        </table>`
      : "";

  const asideBlock = content.asideHtml
    ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
        <tr>
          <td style="padding:14px 16px;">
            ${content.asideHtml}
          </td>
        </tr>
      </table>`
    : "";

  // Wordmark 915×302 → ~220×73 en cabecera (mismo asset que la navbar).
  // bgcolor en <td> + color sólido: Gmail a veces ignora background en style.
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(content.title)} — Barriando</title>
  <style>
    :root { color-scheme: light only; }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f6fa;font-family:Helvetica,Arial,sans-serif;">
  ${
    content.preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(content.preheader)}</div>`
      : ""
  }
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6fa;padding:28px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;background:#ffffff;border:1px solid #e2e8f0;">
          <tr>
            <td align="center" bgcolor="${BRAND}" style="background-color:${BRAND};padding:28px 28px 22px;text-align:center;">
              <!--[if gte mso 9]>
              <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:520px;">
              <v:fill type="tile" color="${BRAND}" />
              <v:textbox style="mso-fit-shape-to-text:true" inset="0,0,0,0">
              <![endif]-->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" bgcolor="${BRAND}" style="background-color:${BRAND};">
                    <a href="${siteUrl}" style="text-decoration:none;color:#ffffff;display:inline-block;text-align:center;">
                      <img
                        src="cid:${BRAND_LOGO_CID}"
                        width="220"
                        height="73"
                        alt="Barriando"
                        style="display:block;margin:0 auto;border:0;outline:none;width:220px;max-width:80%;height:auto;"
                      />
                    </a>
                    <p style="margin:14px 0 0;font-size:11px;letter-spacing:0.04em;color:#d6dceb;text-align:center;">
                      Clúster Turístico · Centro Histórico de Puebla
                    </p>
                  </td>
                </tr>
              </table>
              <!--[if gte mso 9]>
              </v:textbox>
              </v:rect>
              <![endif]-->
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 24px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${ACCENT};">
                ${escapeHtml(content.eyebrow)}
              </p>
              <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;font-weight:700;color:#0f172a;">
                ${escapeHtml(content.title)}
              </h1>
              <div style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
                ${content.bodyHtml}
              </div>
              ${ctaBlock}
              ${asideBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              <div style="border-top:1px solid #e2e8f0;padding-top:16px;">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#94a3b8;">
                  ${escapeHtml(footerNote)}
                </p>
                <p style="margin:0;font-size:11px;color:#94a3b8;">
                  © ${year} Barriando ·
                  <a href="${siteUrl}" style="color:#64748b;text-decoration:underline;">barriando.org</a>
                </p>
              </div>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;font-size:11px;color:#94a3b8;text-align:center;">
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
