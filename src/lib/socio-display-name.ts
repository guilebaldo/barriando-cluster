import { listaSocios } from "@/app/data/socios";

/** Nombres placeholder tipo "Socio #16" que no deben mostrarse al público. */
export function isPlaceholderBusinessName(name: string | null | undefined): boolean {
  const t = name?.trim();
  if (!t) return true;
  return /^socio\s*#?\s*\d+$/i.test(t);
}

/**
 * Nombre visible del negocio: ignora placeholders `Socio #N` y cae al catálogo.
 */
export function resolveSocioDisplayName(
  socioId: number,
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    const t = candidate?.trim();
    if (t && !isPlaceholderBusinessName(t)) return t;
  }
  const catalog = listaSocios.find((s) => s.id === socioId);
  return catalog?.name?.trim() || `Socio #${socioId}`;
}
