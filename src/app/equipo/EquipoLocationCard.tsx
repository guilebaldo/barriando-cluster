"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, MapPin, Navigation } from "lucide-react";

export const BARRIANDO_SEDE = {
  venue: "Casa Zul Hostalgia",
  area: "Centro Histórico, Puebla",
  mapsUrl: "https://maps.app.goo.gl/tq6nhSwV9EeXd3HV6",
  lat: 19.04048085741691,
  lng: -98.1950331411161,
  embedSrc:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.5259224737906!2d-98.19733675951919!3d19.040600853155517!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85cfc14fde640c67%3A0x3b4790246cb5c7a6!2sCasa%20Zul%20Hostalgia%20Puebla!5e0!3m2!1ses-419!2smx!4v1784412496529!5m2!1ses-419!2smx",
} as const;

function formatCoord(value: number, digits = 5): string {
  return value.toFixed(digits);
}

export default function EquipoLocationCard() {
  const [copied, setCopied] = useState(false);
  const coordsLabel = `${formatCoord(BARRIANDO_SEDE.lat)}, ${formatCoord(BARRIANDO_SEDE.lng)}`;

  async function copyCoords() {
    try {
      await navigator.clipboard.writeText(
        `${BARRIANDO_SEDE.lat}, ${BARRIANDO_SEDE.lng}`
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* private mode / denied */
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="relative aspect-[16/11] sm:aspect-[21/10] bg-slate-100">
        <iframe
          title="Ubicación de Barriando en Google Maps"
          src={BARRIANDO_SEDE.embedSrc}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/90 to-transparent sm:from-white/80" />
      </div>

      <div className="relative px-5 sm:px-6 py-5 sm:py-6 -mt-2">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#27366D]/10 text-[#27366D] shrink-0">
            <MapPin className="w-5 h-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
              Nuestra sede
            </p>
            <h3 className="text-base sm:text-lg font-bold text-slate-950 mt-1">
              {BARRIANDO_SEDE.venue}
            </h3>
            <p className="text-sm text-slate-600 font-light mt-0.5">{BARRIANDO_SEDE.area}</p>
            <p className="mt-3 inline-flex items-center gap-2 text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
              <Navigation className="w-3.5 h-3.5 text-[#27366D] shrink-0" aria-hidden />
              {coordsLabel}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <a
            href={BARRIANDO_SEDE.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 flex-1 bg-[#27366D] hover:bg-[#1e2b58] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3 rounded-xl transition active:scale-[0.99]"
          >
            Cómo llegar
            <ExternalLink className="w-3.5 h-3.5 opacity-80" aria-hidden />
          </a>
          <button
            type="button"
            onClick={() => void copyCoords()}
            className="inline-flex items-center justify-center gap-2 flex-1 sm:flex-none sm:min-w-[10.5rem] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold uppercase tracking-wider px-4 py-3 rounded-xl transition active:scale-[0.99]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden />
                Copiar coords
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
