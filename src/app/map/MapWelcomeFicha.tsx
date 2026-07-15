import Link from "next/link";
import type { MapRouteResult } from "@/lib/map-route-client";

export default function MapWelcomeFicha({
  route,
  onStart,
}: {
  route: MapRouteResult;
  onStart: () => void;
}) {
  return (
    <div className="space-y-2.5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Bienvenido al MAP</p>
        <h2 className="text-lg font-black font-serif-cluster text-[#27366D] leading-tight mt-0.5">
          Museo Abierto de Puebla
        </h2>
        <p className="text-sm text-slate-600 font-light leading-snug mt-1.5">
          Recorre el Centro Histórico a pie. Tu ruta se personaliza con GPS desde el punto más cercano.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 text-[11px]">
        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 rounded-full px-2.5 py-1 font-semibold">
          {route.milestoneCount} hitos
        </span>
        {route.premiumCount > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 rounded-full px-2.5 py-1 font-semibold border border-amber-100">
            {route.premiumCount} socios destacados
          </span>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-500 font-light">
        <li className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          Tu ubicación
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          Más cercano
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
          Hito
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#27366D] border border-amber-400 shrink-0" />
          Socio
        </li>
      </ul>

      <button
        type="button"
        onClick={onStart}
        className="w-full bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition active:scale-[0.98]"
      >
        Comenzar recorrido
      </button>

      <p className="text-center">
        <Link
          href="/planes?tipo=comerciales#gran_empresa"
          className="text-[10px] text-slate-400 hover:text-[#27366D] transition underline decoration-dotted underline-offset-2"
        >
          ¿Tu negocio está en el centro? Inscríbete al MAP
        </Link>
      </p>
    </div>
  );
}
