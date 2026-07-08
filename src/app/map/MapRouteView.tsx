"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Camera,
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
  buildWalkingItinerary,
  haversineDistanceKm,
  type MapRouteResult,
} from "@/lib/map-route-client";
import { getHitoIntro } from "@/lib/map-hito-intro";
import { getPointStampHref, getStampDisplayInfo } from "@/lib/map-point-stamp";
import MapStampPreview from "./MapStampPreview";
import MapWelcomeFicha from "./MapWelcomeFicha";
import type { UserMapLocation } from "./GoogleMapRouteMap";
import QrScanModal from "./QrScanModal";

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
          className={`flex-1 px-3 py-2.5 flex items-center justify-center gap-1 transition-all active:scale-95 ${
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

function NavArrowButton({
  direction,
  disabled,
  onClick,
  primary = false,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
  primary?: boolean;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={direction === "prev" ? "Hito anterior" : "Siguiente hito"}
      className={`shrink-0 min-w-[52px] min-h-[52px] rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-35 ${
        primary
          ? "bg-[#27366D] text-amber-400 shadow-md"
          : "border border-slate-200 bg-white text-[#27366D]"
      }`}
    >
      <Icon className="w-7 h-7" strokeWidth={2.5} />
    </button>
  );
}

export default function MapRouteView({ route: initialRoute }: { route: MapRouteResult }) {
  const [route, setRoute] = useState(initialRoute);
  const [selectedId, setSelectedId] = useState<string | null>(initialRoute.points[0]?.id ?? null);
  const [view, setView] = useState<ItineraryView>("map");
  const [cardIndex, setCardIndex] = useState(0);
  const [geoNote, setGeoNote] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserMapLocation | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(true);

  const applyLocationRoute = useCallback(
    (location: UserMapLocation) => {
      setUserLocation(location);
      const reordered = buildWalkingItinerary(location, initialRoute);
      setRoute(reordered);
      const start = reordered.points[0];
      if (start) {
        setSelectedId(start.id);
        setCardIndex(0);
        const km = haversineDistanceKm(location, start);
        setGeoNote(
          `Ruta desde ${start.name} (a ~${Math.max(0, Math.round(km * 1000))} m de ti). Sigue el trazo punteado caminando.`
        );
        setGeoError(null);
      }
    },
    [initialRoute]
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Tu dispositivo no expone geolocalización. Usa la lista para elegir tu hito.");
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      applyLocationRoute({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
    };

    const onError = () => {
      setGeoError("Activa la ubicación para ver tu posición y ordenar la ruta desde el hito más cercano.");
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 12_000,
      maximumAge: 30_000,
    });

    const watchId = navigator.geolocation.watchPosition(onSuccess, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 15_000,
      timeout: 20_000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [applyLocationRoute]);

  const selectedIndex = useMemo(
    () => route.points.findIndex((p) => p.id === selectedId),
    [route.points, selectedId]
  );

  const activeCardIndex = view === "card" ? cardIndex : Math.max(0, selectedIndex);
  const activePoint = route.points[activeCardIndex] ?? route.points[0];
  const stampHref = activePoint ? getPointStampHref(activePoint) : null;
  const stampDisplay = activePoint ? getStampDisplayInfo(activePoint) : null;

  function selectPoint(id: string) {
    setWelcomeOpen(false);
    setSelectedId(id);
    const idx = route.points.findIndex((p) => p.id === id);
    if (idx >= 0) setCardIndex(idx);
  }

  function goToIndex(next: number) {
    const clamped = Math.max(0, Math.min(route.points.length - 1, next));
    setCardIndex(clamped);
    selectPoint(route.points[clamped].id);
  }

  const legend = (
    <div className="flex flex-wrap gap-3 text-[11px] text-slate-600">
      <span className="inline-flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
        Tu ubicación
      </span>
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
        Socio destacado
      </span>
    </div>
  );

  const fichaBody = activePoint && (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700/90">
            Hito {activePoint.order} de {route.points.length}
          </p>
          <h3 className="text-lg font-black font-serif-cluster text-[#27366D] leading-tight mt-1">
            {activePoint.name}
          </h3>
        </div>
        {activePoint.kind === "premium_business" ? (
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
        ) : (
          <Landmark className="w-5 h-5 text-slate-400 shrink-0" />
        )}
      </div>

      {stampDisplay && <MapStampPreview stamp={stampDisplay} />}

      <p className="text-sm text-slate-600 leading-relaxed font-light mt-3 line-clamp-3">
        {getHitoIntro(activePoint.name, activePoint.zone)}
      </p>

      {activePoint.category && (
        <p className="text-[11px] text-slate-500 mt-2 font-medium">{activePoint.category}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        {stampHref && (
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-lg transition active:scale-95"
          >
            <Camera className="w-4 h-4" />
            Escanear QR
          </button>
        )}
        <Link
          href={activePoint.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 border border-slate-200 text-[#27366D] text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-lg hover:bg-slate-50 transition active:scale-95"
        >
          <MapPin className="w-4 h-4" />
          Maps
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </>
  );

  const navRow = (
    <div className="flex items-center gap-3">
      <NavArrowButton
        direction="prev"
        disabled={activeCardIndex <= 0}
        onClick={() => goToIndex(activeCardIndex - 1)}
      />
      <div className="flex-1 text-center min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Siguiente parada</p>
        <p className="text-sm font-semibold text-slate-800 truncate">
          {route.points[activeCardIndex + 1]?.name ?? "Fin del recorrido"}
        </p>
      </div>
      <NavArrowButton
        direction="next"
        disabled={activeCardIndex >= route.points.length - 1}
        primary
        onClick={() => goToIndex(activeCardIndex + 1)}
      />
    </div>
  );

  const listView = (
    <ol className="space-y-3 max-h-[min(60vh,420px)] overflow-y-auto pr-1">
      {route.points.map((point) => {
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
                className={`shrink-0 w-8 h-8 rounded-full text-xs font-black flex items-center justify-center ${
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
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );

  const cardView = (
    <div className="min-h-[min(50vh,380px)] flex flex-col">
      <div className="flex-1 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-inner">
        {fichaBody}
      </div>
      <div className="mt-4">{navRow}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      {geoNote && (
        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
          {geoNote}
        </p>
      )}
      {geoError && (
        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          {geoError}
        </p>
      )}

      <ViewTabs view={view} setView={setView} className="lg:hidden" />

      {/* Móvil */}
      <div className="lg:hidden space-y-0">
        {view === "map" && (
          <div className="-mx-6 sm:mx-0">
            <GoogleMapRouteMap
              points={route.points}
              highlightedId={selectedId}
              userLocation={userLocation}
              fullScreen
              onPointSelect={selectPoint}
            />
            <div className="sticky bottom-0 left-0 right-0 z-20 mt-3 px-1 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 space-y-3">
                {welcomeOpen ? (
                  <MapWelcomeFicha route={initialRoute} onStart={() => setWelcomeOpen(false)} />
                ) : (
                  <>
                    {fichaBody}
                    {navRow}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {view === "list" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">{listView}</div>
        )}
        {view === "card" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">{cardView}</div>
        )}
        {view === "map" && <div className="pt-2 px-1">{legend}</div>}
      </div>

      {/* Escritorio */}
      <section className="hidden lg:grid lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-4 relative z-0">
          <GoogleMapRouteMap
            points={route.points}
            highlightedId={selectedId}
            userLocation={userLocation}
            onPointSelect={selectPoint}
          />
          {legend}
        </div>
        <aside className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-24">
          {welcomeOpen ? (
            <MapWelcomeFicha route={initialRoute} onStart={() => setWelcomeOpen(false)} />
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
                  Itinerario peatonal
                </h2>
                <ViewTabs view={view === "map" ? "list" : view} setView={setView} />
              </div>
              <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                Recorrido desde <strong className="text-slate-700">{route.startName}</strong>. Línea punteada
                = caminando.
              </p>
              {view === "card" ? cardView : listView}
              {view !== "card" && activePoint && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  {fichaBody}
                  {navRow}
                </div>
              )}
            </>
          )}
        </aside>
      </section>

      <QrScanModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        fallbackHref={stampHref ?? "/pasaporte"}
      />
    </div>
  );
}
