/**
 * Enmascara datos personales antes de mandarlos a los logs.
 *
 * Los logs de producción (Vercel) son legibles por cualquiera con acceso al
 * proyecto y se retienen semanas; un correo completo ahí es una fuga de PII y
 * material listo para phishing. En desarrollo devolvemos el valor íntegro
 * porque hace falta para depurar.
 */
export function redactEmail(email?: string | null): string {
  if (!email) return "(sin email)";
  if (process.env.NODE_ENV !== "production") return email;

  const at = email.lastIndexOf("@");
  if (at <= 0) return "***";

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const head = local.slice(0, 1);
  return `${head}***@${domain}`;
}
