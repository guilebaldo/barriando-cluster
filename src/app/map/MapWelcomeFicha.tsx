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
          {route.milestoneCount} hitos patrimoniales
        </span>
        {route.premiumCount > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 rounded-full px-3 py-1.5 font-semibold border border-amber-100 animate-soft-glow">
            {route.premiumCount} socios destacados
          </span>
        )}
      </div>

      <ul className="text-xs text-slate-500 space-y-1.5 font-light">
        <li className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          Punto azul = tu ubicación
        </li>
        <li className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
          Ámbar = punto más cercano
        </li>
        <li className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
          Gris = hito patrimonial
        </li>
        <li className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#27366D] border border-amber-400 shrink-0" />
          Azul oscuro = socio destacado
        </li>
        <li>· Línea punteada = caminar entre paradas</li>
      </ul>

      <button
        type="button"
        onClick={onStart}
        className="w-full mt-1 bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition active:scale-[0.98]"
      >
        Comenzar recorrido
      </button>

      <p className="text-center pt-1">
        <Link
          href="/planes#gran_empresa"
          className="text-[10px] text-slate-400 hover:text-[#27366D] transition underline decoration-dotted underline-offset-2"
        >
          ¿Tu negocio está en el centro? Inscríbete al MAP
        </Link>
      </p>
    </div>
  );
}
