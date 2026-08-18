const ALLOWED = new Set(["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li"]);

/** Quita etiquetas y atributos no permitidos de la descripción de un pase. */
export function sanitizeAccessDescription(html: string, maxLength = 8000): string {
  const raw = html.replace(/\u00a0/g, " ").trim();
  if (!raw) return "";

  const withoutBlocks = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const cleaned = withoutBlocks.replace(/<\/?([a-z0-9]+)(\s[^>]*)?\/?>/gi, (match, tag: string) => {
    const name = tag.toLowerCase();
    const closing = match.startsWith("</");
    const selfClosing = name === "br";
    if (name === "div") return closing ? "</p>" : "<p>";
    if (!ALLOWED.has(name)) return "";
    if (selfClosing) return "<br>";
    return closing ? `</${name}>` : `<${name}>`;
  });

  return cleaned.replace(/javascript:/gi, "").slice(0, maxLength);
}

export function stripAccessDescription(html: string): string {
  return sanitizeAccessDescription(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function accessDescriptionIsEmpty(html: string): boolean {
  return !stripAccessDescription(html);
}
