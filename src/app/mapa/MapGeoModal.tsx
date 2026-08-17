"use client";

import { Loader2, MapPin, X } from "lucide-react";

export default function MapGeoModal({
  open,
  onClose,
  onRetry,
  detail,
  retrying = false,
}: {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  /** Mensaje concreto (p. ej. GPS apagado en Ajustes). */
  detail?: string | null;
  retrying?: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 app-modal-hub-pad bg-black/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-geo-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={retrying}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition disabled:opacity-40"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-blue-50 text-blue-600 mb-4">
          <MapPin className="w-5 h-5" />
        </span>

        <h2 id="map-geo-title" className="text-lg font-bold text-[#27366D] pr-8">
          Activa tu ubicación
        </h2>
        <p className="text-sm text-slate-600 font-light leading-relaxed mt-2">
          Permite el acceso a tu ubicación para ver tu posición en el mapa y ordenar la ruta desde el hito más
          cercano a ti.
        </p>
        {retrying ? (
          <p
            className="mt-3 text-sm font-medium text-[#27366D] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 leading-snug inline-flex items-center gap-2"
            role="status"
          >
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            Buscando tu ubicación…
          </p>
        ) : detail ? (
          <p
            className="mt-3 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2.5 leading-snug"
            role="status"
          >
            {detail}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 mt-6">
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="w-full bg-[#27366D] hover:bg-[#1e2b58] disabled:opacity-70 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition active:scale-[0.98] inline-flex items-center justify-center gap-2"
          >
            {retrying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Localizando…
              </>
            ) : (
              "Reintentar ubicación"
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={retrying}
            className="w-full text-slate-500 hover:text-slate-700 text-xs font-semibold py-2 transition disabled:opacity-40"
          >
            Continuar sin GPS
          </button>
        </div>
      </div>
    </div>
  );
}
