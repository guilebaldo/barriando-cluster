"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const AccessEventMiniMapInner = dynamic(() => import("./AccessEventMiniMapInner"), {
  ssr: false,
  loading: () => (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 aspect-[16/10] flex items-center justify-center text-[11px] text-slate-400">
      Cargando mapa…
    </div>
  ),
});

function fallbackMapsUrl(
  venue: string,
  latitude: number | null | undefined,
  longitude: number | null | undefined
): string {
  const hasCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);
  if (hasCoords) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${venue}, Centro Histórico, Puebla, México`
  )}`;
}

/** Miniatura del lugar: Leaflet/OSM (el CSP bloquea iframes de Google Maps). */
export default function AccessEventMiniMap({
  venue,
  latitude = null,
  longitude = null,
  mapsUrl = null,
  className = "",
}: {
  venue: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Google Maps del negocio sede (maps.app.goo.gl / ficha registrada). */
  mapsUrl?: string | null;
  className?: string;
}) {
  const hasCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const registered =
    mapsUrl?.trim() && /^https?:\/\//i.test(mapsUrl.trim()) ? mapsUrl.trim() : null;
  const openSrc = registered ?? fallbackMapsUrl(venue, latitude, longitude);

  return (
    <div className={className}>
      <a
        href={openSrc}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir ${venue} en Google Maps`}
        className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#27366D]/30"
      >
        <AccessEventMiniMapInner
          venue={venue}
          latitude={latitude}
          longitude={longitude}
        />
      </a>
      {!hasCoords ? (
        <p className="mt-1.5 text-[10px] text-slate-400">
          Ubicación aproximada · Centro Histórico
        </p>
      ) : null}
      <a
        href={openSrc}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#27366D] hover:text-amber-600"
      >
        <MapPin className="w-3.5 h-3.5" />
        Abrir en Maps
      </a>
    </div>
  );
}
