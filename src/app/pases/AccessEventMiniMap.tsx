"use client";

import { MapPin } from "lucide-react";

/** Mapa embebido por dirección del venue (sin lat/lng en el evento). */
export default function AccessEventMiniMap({
  venue,
  className = "",
}: {
  venue: string;
  className?: string;
}) {
  const query = encodeURIComponent(`${venue}, Centro Histórico, Puebla, México`);
  const embedSrc = `https://maps.google.com/maps?q=${query}&z=16&hl=es&output=embed`;
  const openSrc = `https://www.google.com/maps/search/?api=1&query=${query}`;

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
