"use client";

import { MapPin, X } from "lucide-react";

export default function MapGeoModal({
  open,
  onClose,
  onRetry,
}: {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-geo-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
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

        <div className="flex flex-col gap-2 mt-6">
          <button
            type="button"
            onClick={onRetry}
            className="w-full bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition active:scale-[0.98]"
          >
            Permitir ubicación
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-slate-500 hover:text-slate-700 text-xs font-semibold py-2 transition"
          >
            Continuar sin GPS
          </button>
        </div>
      </div>
    </div>
  );
}
