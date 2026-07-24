/** Plantilla HTML del magic link (español). */
export function magicLinkEmailHtml(params: {
  url: string;
  host: string;
}): string {
  const { url, host } = params;
  const brand = "#27366D";
  return `<!DOCTYPE html>
<html lang="es">
<body style="background:#f8fafc;font-family:Plus Jakarta Sans,Helvetica,Arial,sans-serif;margin:0;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;" role="presentation">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${brand};">Barriando</p>
              <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Tu enlace de acceso</h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#64748b;">
                Haz clic en el botón para entrar a tu cuenta en <strong style="color:#0f172a;">${host}</strong>.
                El enlace caduca en 24 horas y solo se puede usar una vez.
              </p>
              <p style="margin:0 0 28px;text-align:center;">
                <a href="${url}"
                   style="display:inline-block;background:${brand};color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:8px;">
                  Entrar a Barriando
                </a>
              </p>
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#94a3b8;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0;font-size:11px;word-break:break-all;color:#64748b;">${url}</p>
              <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;">
                Si no pediste este correo, puedes ignorarlo.
              </p>
            </td>
          </tr>
        </table>
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

Si no pediste este correo, ignóralo.`;
}
