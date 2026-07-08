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
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  buildWalkingItinerary,
  type MapRouteResult,
} from "@/lib/map-route-client";
import { getHitoIntro } from "@/lib/map-hito-intro";
import { getPointStampHref, getStampDisplayInfo } from "@/lib/map-point-stamp";
import MapStampPreview from "./MapStampPreview";
import MapWelcomeFicha from "./MapWelcomeFicha";
import MapGeoModal from "./MapGeoModal";
import type { UserMapLocation } from "./GoogleMapRouteMap";
import QrScanModal from "./QrScanModal";

const GoogleMapRouteMap = dynamic(() => import("./GoogleMapRouteMap"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-100 animate-pulse" />,
});

function NavArrowButton({
  direction,
  onClick,
  primary = false,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  primary?: boolean;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Hito anterior" : "Siguiente hito"}
      className={`shrink-0 min-w-[52px] min-h-[52px] rounded-xl flex items-center justify-center transition-all active:scale-95 ${
        primary
          ? "bg-[#27366D] text-amber-400 shadow-md animate-soft-blink"
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
  const [cardIndex, setCardIndex] = useState(0);
  const [geoModalOpen, setGeoModalOpen] = useState(false);
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
      }
      setGeoModalOpen(false);
    },
    [initialRoute]
  );

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoModalOpen(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyLocationRoute({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => setGeoModalOpen(true),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 }
    );
  }, [applyLocationRoute]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoModalOpen(true);
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      applyLocationRoute({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
    };

    const onError = () => setGeoModalOpen(true);

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

  const activeCardIndex = Math.max(0, selectedIndex >= 0 ? selectedIndex : cardIndex);
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
    const total = route.points.length;
    if (!total) return;
    const wrapped = ((next % total) + total) % total;
    setCardIndex(wrapped);
    selectPoint(route.points[wrapped].id);
  }

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
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0 animate-soft-blink" />
        ) : (
          <Landmark className="w-5 h-5 text-slate-400 shrink-0 animate-soft-blink" />
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
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-lg transition active:scale-95 animate-soft-glow"
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
        onClick={() => goToIndex(activeCardIndex - 1)}
      />
      <div className="flex-1 text-center min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Siguiente parada</p>
        <p className="text-sm font-semibold text-slate-800 truncate">
          {route.points[(activeCardIndex + 1) % route.points.length]?.name ?? "Fin del recorrido"}
        </p>
      </div>
      <NavArrowButton
        direction="next"
        primary
        onClick={() => goToIndex(activeCardIndex + 1)}
      />
    </div>
  );

  return (
    <div className="relative flex-1 min-h-0 w-full">
      <div className="absolute inset-0">
        <GoogleMapRouteMap
          points={route.points}
          highlightedId={selectedId}
          userLocation={userLocation}
          fullScreen
          immersive
          onPointSelect={selectPoint}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 px-2 sm:px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-2xl p-4 space-y-3 max-h-[min(52vh,420px)] overflow-y-auto">
          {welcomeOpen ? (
            <MapWelcomeFicha route={initialRoute} onStart={() => setWelcomeOpen(false)} />
          ) : (
            <>
              {fichaBody}
              {navRow}
              <p className="text-center">
                <Link
                  href="/planes#gran_empresa"
                  className="text-[10px] text-slate-400 hover:text-[#27366D] transition underline decoration-dotted underline-offset-2"
                >
                  ¿Tu negocio está en el centro? Inscríbete al MAP
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <MapGeoModal
        open={geoModalOpen}
        onClose={() => setGeoModalOpen(false)}
        onRetry={requestGeolocation}
      />

      <QrScanModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        fallbackHref={stampHref ?? "/pasaporte"}
      />
    </div>
  );
}
