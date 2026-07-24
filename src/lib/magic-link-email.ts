/** URL pública canónica para assets del correo (clientes de email no resuelven rutas relativas). */
function resolveAppOrigin(): string {
  const fromEnv = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "https://barriando.org"
  ).replace(/\/$/, "");
  return fromEnv;
}

/** Plantilla HTML del magic link (español, marca Barriando). */
export function magicLinkEmailHtml(params: {
  url: string;
  host: string;
}): string {
  const { url, host } = params;
  const brand = "#27366D";
  const brandDeep = "#1e2b58";
  const accent = "#f59e0b";
  const origin = resolveAppOrigin();
  const faviconUrl = `${origin}/logos/favicon.png`;
  const siteUrl = origin;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Tu enlace de acceso — Barriando</title>
</head>
<body style="margin:0;padding:0;background:#eef1f7;font-family:Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Tu enlace para entrar a Barriando. Válido 24 horas, un solo uso.
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#eef1f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;border-radius:16px;overflow:hidden;background:#ffffff;border:1px solid #d8dee9;box-shadow:0 12px 32px rgba(39,54,109,0.10);">
          <!-- Header marca -->
          <tr>
            <td style="background:${brand};background:linear-gradient(145deg, ${brand} 0%, ${brandDeep} 100%);padding:28px 32px;text-align:center;">
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

          <!-- Cuerpo -->
          <tr>
            <td style="padding:36px 32px 28px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${accent};">
                Acceso seguro
              </p>
              <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:800;color:#0f172a;">
                Tu enlace de acceso
              </h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#64748b;">
                Haz clic en el botón para entrar a tu cuenta en
                <strong style="color:#0f172a;">${host}</strong>.
                El enlace caduca en <strong style="color:#0f172a;">24 horas</strong> y solo se puede usar una vez.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding:0 0 28px;">
                    <a href="${url}"
                       style="display:inline-block;background:${brand};color:#ffffff;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:16px 36px;border-radius:10px;box-shadow:0 8px 20px rgba(39,54,109,0.28);">
                      Entrar a Barriando
                    </a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;">
                      ¿El botón no funciona?
                    </p>
                    <p style="margin:0;font-size:11px;line-height:1.5;word-break:break-all;color:#64748b;">
                      <a href="${url}" style="color:${brand};text-decoration:underline;">${url}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 28px;">
              <div style="border-top:1px solid #e2e8f0;padding-top:20px;">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#94a3b8;">
                  Si no pediste este correo, puedes ignorarlo. Tu cuenta permanece segura.
                </p>
                <p style="margin:0;font-size:11px;color:#cbd5e1;">
                  © ${new Date().getFullYear()} Barriando ·
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

export function magicLinkEmailText(params: { url: string; host: string }): string {
  const { url, host } = params;
  return `Barriando — tu enlace de acceso

Entra a tu cuenta en ${host} con este enlace (válido 24 horas, un solo uso):

${url}

Si no pediste este correo, ignóralo.

https://barriando.org`;
}
