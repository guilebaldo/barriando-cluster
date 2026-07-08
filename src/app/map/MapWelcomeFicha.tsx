import { MapPin, Route } from "lucide-react";
import type { MapRouteResult } from "@/lib/map-route-client";

export default function MapWelcomeFicha({
  route,
  onStart,
}: {
  route: MapRouteResult;
  onStart: () => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Bienvenido al MAP</p>
        <h2 className="text-xl font-black font-serif-cluster text-[#27366D] leading-tight mt-1">
          Museo Abierto de Puebla
        </h2>
        <p className="text-sm text-slate-600 font-light leading-relaxed mt-2">
          Recorre el Centro Histórico a pie. Tu ruta se personaliza con GPS desde el punto más cercano a ti.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 rounded-full px-3 py-1.5 font-semibold">
          <Route className="w-3.5 h-3.5 text-[#27366D]" />
          {route.milestoneCount} hitos
        </span>
        {route.premiumCount > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 rounded-full px-3 py-1.5 font-semibold border border-amber-100">
            {route.premiumCount} socios destacados
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 rounded-full px-3 py-1.5 font-semibold border border-blue-100">
          <MapPin className="w-3.5 h-3.5" />
          Ruta peatonal
        </span>
      </div>

      <ul className="text-xs text-slate-500 space-y-1.5 font-light">
        <li>· Punto azul = tu ubicación</li>
        <li>· Línea punteada = caminar entre paradas</li>
        <li>· Toca un marcador para ver sellos especiales</li>
      </ul>

      <button
        type="button"
        onClick={onStart}
        className="w-full mt-1 bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition active:scale-[0.98]"
      >
        Comenzar recorrido
      </button>
    </div>
  );
}
