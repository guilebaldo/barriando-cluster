import { sociosCoords } from "@/app/data/socios-coords";
import type { Socio } from "@/app/data/socios";

/** Resuelve pin del mapa: perfil DB primero, catálogo estático después. */
export function resolveSocioMapCoord(
  socio: Pick<Socio, "id" | "latitude" | "longitude">
): { lat: number; lng: number } | null {
  if (
    typeof socio.latitude === "number" &&
    typeof socio.longitude === "number" &&
    Number.isFinite(socio.latitude) &&
    Number.isFinite(socio.longitude)
  ) {
    return { lat: socio.latitude, lng: socio.longitude };
  }
  const fromCatalog = sociosCoords[socio.id];
  return fromCatalog ? { lat: fromCatalog.lat, lng: fromCatalog.lng } : null;
}
