import { listaSocios } from "@/app/data/socios";

/** Categorías del directorio /socios (única fuente de verdad). */
function buildSociosCategoryOptions(): readonly [string, ...string[]] {
  const unique = [...new Set(listaSocios.map((s) => s.categoria))].sort();
  if (unique.length === 0) return ["Servicios"];
  return unique as [string, ...string[]];
}

export const BUSINESS_CATEGORY_OPTIONS = buildSociosCategoryOptions();

export type BusinessCategory = (typeof BUSINESS_CATEGORY_OPTIONS)[number];

/** Incluye valor guardado aunque ya no esté en el catálogo (perfiles antiguos). */
export function categorySelectOptions(current?: string | null): string[] {
  const base = [...BUSINESS_CATEGORY_OPTIONS];
  const trimmed = current?.trim();
  if (trimmed && !base.includes(trimmed)) {
    return [trimmed, ...base];
  }
  return base;
}
