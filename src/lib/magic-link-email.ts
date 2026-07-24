import { resolveAppOrigin } from "@/lib/email";
import { escapeHtml, renderBrandedEmailHtml } from "@/lib/email-layout";

/** Plantilla HTML del magic link (español, marca Barriando). */
export function magicLinkEmailHtml(params: {
  url: string;
  host: string;
}): string {
  const { url, host } = params;
  const brand = "#27366D";

  return renderBrandedEmailHtml({
    eyebrow: "Acceso seguro",
    title: "Tu enlace de acceso",
    preheader: "Tu enlace para entrar a Barriando. Válido 24 horas, un solo uso.",
    bodyHtml: `
      <p style="margin:0;">
        Haz clic en el botón para entrar a tu cuenta en
        <strong style="color:#0f172a;">${escapeHtml(host)}</strong>.
        El enlace caduca en <strong style="color:#0f172a;">24 horas</strong> y solo se puede usar una vez.
      </p>
    `,
    ctaLabel: "Entrar a Barriando",
    ctaUrl: url,
    asideHtml: `
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;">
        ¿El botón no funciona?
      </p>
      <p style="margin:0;font-size:11px;line-height:1.5;word-break:break-all;color:#64748b;">
        <a href="${url}" style="color:${brand};text-decoration:underline;">${escapeHtml(url)}</a>
      </p>
    `,
    footerNote: "Si no pediste este correo, puedes ignorarlo. Tu cuenta permanece segura.",
  });
}

export function magicLinkEmailText(params: { url: string; host: string }): string {
  const { url, host } = params;
  const origin = resolveAppOrigin();
  return `Barriando — tu enlace de acceso

Entra a tu cuenta en ${host} con este enlace (válido 24 horas, un solo uso):

${url}

Si no pediste este correo, ignóralo.

${origin}`;
}
