"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Landmark,
  List,
  Map as MapIcon,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  findNearestRoutePoint,
  haversineDistanceKm,
  reorderRouteFromPoint,
  type MapRouteResult,
} from "@/lib/map-route-client";
import { getHitoIntro } from "@/lib/map-hito-intro";

const GoogleMapRouteMap = dynamic(() => import("./GoogleMapRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[min(70vh,520px)] rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
  ),
});

type ItineraryView = "list" | "card" | "map";

function ViewTabs({
  view,
  setView,
  className = "",
}: {
  view: ItineraryView;
  setView: (v: ItineraryView) => void;
  className?: string;
}) {
  const tabs: { id: ItineraryView; label: string; icon: React.ReactNode }[] = [
    { id: "map", label: "Mapa", icon: <MapIcon className="w-3.5 h-3.5" /> },
    { id: "card", label: "Fichas", icon: null },
    { id: "list", label: "Lista", icon: <List className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className={`flex rounded-lg border border-slate-200 overflow-hidden text-[10px] font-bold uppercase tracking-wider ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setView(tab.id)}
          className={`flex-1 px-3 py-2 flex items-center justify-center gap-1 transition-all active:scale-95 ${
            view === tab.id ? "bg-[#27366D] text-amber-400" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function MapRouteView({ route: initialRoute }: { route: MapRouteResult }) {
  const [route, setRoute] = useState(initialRoute);
  const [selectedId, setSelectedId] = useState<string | null>(initialRoute.points[0]?.id ?? null);
  const [view, setView] = useState<ItineraryView>("map");
  const [cardIndex, setCardIndex] = useState(0);
  const [geoNote, setGeoNote] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        const nearest = findNearestRoutePoint(location, initialRoute.points);
        if (!nearest) return;
        const reordered = reorderRouteFromPoint(initialRoute, nearest.id);
        setRoute(reordered);
        setSelectedId(nearest.id);
        setCardIndex(0);
        const km = haversineDistanceKm(location, nearest);
        setGeoNote(
          `Punto de partida: ${nearest.name} (a ~${(km * 1000).toFixed(0)} m de ti)`
        );
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120_000 }
    );
  }, [initialRoute]);

  const selectedIndex = useMemo(
    () => route.points.findIndex((p) => p.id === selectedId),
    [route.points, selectedId]
  );

  const activeCardIndex = view === "card" ? cardIndex : Math.max(0, selectedIndex);
  const activePoint = route.points[activeCardIndex] ?? route.points[0];

  function selectPoint(id: string) {
    setSelectedId(id);
    const idx = route.points.findIndex((p) => p.id === id);
    if (idx >= 0) setCardIndex(idx);
  }

  const legend = (
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
        Socio Gran Empresa
      </span>
    </div>
  );

  const listView = (
    <ol className="space-y-3 max-h-[min(60vh,420px)] overflow-y-auto pr-1">
      {route.points.map((point, idx) => {
        const isSelected = selectedId === point.id;
        return (
          <li key={point.id}>
            <button
              type="button"
              onClick={() => selectPoint(point.id)}
              className={`w-full text-left flex gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] ${
                isSelected
                  ? "border-amber-400 bg-amber-50/90 ring-2 ring-amber-400/25 shadow-sm"
                  : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/80"
              }`}
            >
              <span
                className={`shrink-0 w-7 h-7 rounded-full text-xs font-black flex items-center justify-center ${
                  isSelected ? "bg-amber-500 text-slate-950" : "bg-[#27366D] text-amber-400"
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
                <Link
                  href={point.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#27366D] hover:text-red-800 active:text-red-900 mt-2 ml-5 transition-all active:scale-95"
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
  );

  const cardView = (
    <div className="min-h-[min(60vh,420px)] flex flex-col">
      <div className="flex-1 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-6 shadow-inner">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700/80 mb-2">
          Hito {activePoint?.order} de {route.points.length}
        </p>
        <h3 className="text-xl font-black font-serif-cluster text-[#27366D] leading-tight mb-4">
          {activePoint?.name}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed font-light">
          {activePoint ? getHitoIntro(activePoint.name, activePoint.zone) : ""}
        </p>
        {activePoint?.category && (
          <p className="text-[11px] text-slate-500 mt-4 font-medium">{activePoint.category}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button
          type="button"
          disabled={activeCardIndex <= 0}
          onClick={() => {
            const next = Math.max(0, activeCardIndex - 1);
            setCardIndex(next);
            selectPoint(route.points[next].id);
          }}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-white font-bold text-sm text-[#27366D] disabled:opacity-40 transition-all active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
          Anterior Hito
        </button>
        <button
          type="button"
          disabled={activeCardIndex >= route.points.length - 1}
          onClick={() => {
            const next = Math.min(route.points.length - 1, activeCardIndex + 1);
            setCardIndex(next);
            selectPoint(route.points[next].id);
          }}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#27366D] font-bold text-sm text-amber-400 disabled:opacity-40 transition-all active:scale-95"
        >
          Siguiente Hito
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {geoNote && (
        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
          {geoNote}
        </p>
      )}

      <ViewTabs view={view} setView={setView} className="lg:hidden" />

      {/* Móvil: una vista a la vez */}
      <div className="lg:hidden space-y-4">
        {view === "map" && (
          <GoogleMapRouteMap
            points={route.points}
            highlightedId={selectedId}
            fullScreen
            onPointSelect={selectPoint}
          />
        )}
        {view === "list" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">{listView}</div>
        )}
        {view === "card" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">{cardView}</div>
        )}
        {view === "map" && legend}
      </div>

      {/* Escritorio: mapa + panel lateral */}
      <section className="hidden lg:grid lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-4 relative z-0">
          <GoogleMapRouteMap
            points={route.points}
            highlightedId={selectedId}
            onPointSelect={selectPoint}
          />
          {legend}
        </div>
        <aside className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
              Itinerario peatonal
            </h2>
            <ViewTabs view={view === "map" ? "list" : view} setView={setView} />
          </div>
          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
            Recorrido desde <strong className="text-slate-700">{route.startName}</strong> con ruta peatonal
            por calles reales.
          </p>
          {view === "card" ? cardView : listView}
        </aside>
      </section>
    </div>
  );
}
