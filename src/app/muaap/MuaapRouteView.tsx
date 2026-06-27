"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ExternalLink, Landmark, MapPin, Sparkles } from "lucide-react";
import type { MuaapRouteResult } from "@/lib/muaapRoute";

const MuaapRouteMap = dynamic(() => import("./MuaapRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[min(70vh,520px)] rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
  ),
});

export default function MuaapRouteView({ route }: { route: MuaapRouteResult }) {
  const [selectedId, setSelectedId] = useState<string | null>(route.points[0]?.id ?? null);

  return (
    <div className="space-y-8">
      <section className="grid lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-4">
          <MuaapRouteMap points={route.points} walkPath={route.walkPath} highlightedId={selectedId} />
          <div className="flex flex-wrap gap-4 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 border-2 border-[#27366D]" />
              Punto de partida
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400 border-2 border-white shadow-sm" />
              Hito patrimonial
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#27366D] border-2 border-amber-400" />
              Socio Gran Empresa (Premium)
            </span>
            <span className="text-slate-400">Toca un hito en la lista para resaltarlo en el mapa</span>
          </div>
        </div>

        <aside className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest mb-1">
            Itinerario optimizado
          </h2>
          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
            Ruta peatonal calculada con vecino más cercano desde{" "}
            <strong className="text-slate-700">{route.startName}</strong>.{" "}
            {route.premiumCount > 0
              ? `${route.premiumCount} negocio(s) premium activos en el circuito.`
              : "Los socios Gran Empresa aparecerán aquí cuando tengan membresía activa."}
          </p>
          <ol className="space-y-3 max-h-[min(60vh,420px)] overflow-y-auto pr-1">
            {route.points.map((point, idx) => {
              const isSelected = selectedId === point.id;
              return (
                <li key={point.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(point.id)}
                    className={`w-full text-left flex gap-3 p-3 rounded-xl border transition ${
                      isSelected
                        ? "border-amber-400 bg-amber-50/90 ring-2 ring-amber-400/25 shadow-sm"
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/80"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-7 h-7 rounded-full text-xs font-black flex items-center justify-center transition ${
                        isSelected
                          ? "bg-amber-500 text-slate-950"
                          : "bg-[#27366D] text-amber-400"
                      }`}
                    >
                      {point.order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-1.5">
                        {point.kind === "premium_business" ? (
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        ) : (
                          <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <p className="text-sm font-semibold text-slate-900 leading-snug">{point.name}</p>
                      </div>
                      {point.category && (
                        <p className="text-[10px] text-slate-500 mt-0.5 ml-5">{point.category}</p>
                      )}
                      {idx < route.points.length - 1 && (
                        <p className="text-[10px] text-slate-400 mt-1 ml-5">
                          → {route.points[idx + 1].name}
                        </p>
                      )}
                      <Link
                        href={point.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#27366D] hover:text-amber-600 mt-2 ml-5 transition"
                      >
                        <MapPin className="w-3 h-3" />
                        Google Maps
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>
      </section>
    </div>
  );
}
