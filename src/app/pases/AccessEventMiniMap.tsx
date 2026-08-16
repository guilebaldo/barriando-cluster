"use client";

import { MapPin } from "lucide-react";

/** Mapa miniatura: coords del admin si existen; si no, búsqueda por venue. */
export default function AccessEventMiniMap({
  venue,
  latitude = null,
  longitude = null,
  className = "",
}: {
  venue: string;
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}) {
  const hasCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const embedSrc = hasCoords
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&hl=es&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(
        `${venue}, Centro Histórico, Puebla, México`
      )}&z=16&hl=es&output=embed`;

  const openSrc = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${venue}, Centro Histórico, Puebla, México`
      )}`;

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 aspect-[16/10]">
        <iframe
          title={`Mapa de ${venue}`}
          src={embedSrc}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
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
