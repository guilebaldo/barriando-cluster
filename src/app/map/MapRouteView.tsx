"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { buildWalkingItinerary, haversineDistanceKm, type MapRouteResult } from "@/lib/map-route-client";
import { getHitoIntro } from "@/lib/map-hito-intro";
import { getPointStampHref } from "@/lib/map-point-stamp";
import MapWelcomeFicha from "./MapWelcomeFicha";
import MapGeoModal from "./MapGeoModal";
import type { UserMapLocation } from "./user-map-location";
import QrScanModal from "../components/QrScanModal";

const MapRouteMap = dynamic(() => import("./MapRouteMap"), {
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
          ? "bg-[#27366D] text-amber-400 shadow-md"
          : "border border-slate-200 bg-white text-[#27366D]"
      }`}
    >
      <Icon
        className={`w-7 h-7 ${primary ? "animate-soft-scale" : ""}`}
        strokeWidth={2.5}
      />
    </button>
  );
}

export default function MapRouteView({ route: initialRoute }: { route: MapRouteResult }) {
  return (
    <Suspense fallback={<div className="absolute inset-0 bg-slate-100 animate-pulse" />}>
      <MapRouteViewInner route={initialRoute} />
    </Suspense>
  );
}

function MapRouteViewInner({ route: initialRoute }: { route: MapRouteResult }) {
  const searchParams = useSearchParams();
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const hasAutoRoutedRef = useRef(false);

  const [route, setRoute] = useState(initialRoute);
  const [selectedId, setSelectedId] = useState<string | null>(initialRoute.points[0]?.id ?? null);
  const [cardIndex, setCardIndex] = useState(0);
  const [geoModalOpen, setGeoModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<UserMapLocation | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(0);
  const [scannerOpen, setScannerOpen] = useState(false);

  const hasSocioDeepLink = useMemo(() => {
    const socioParam = searchParams.get("socio");
    return socioParam != null && Number.isFinite(Number(socioParam));
  }, [searchParams]);

  const focusSocioOnRoute = useCallback(
    (currentRoute: MapRouteResult) => {
      const socioParam = searchParams.get("socio");
      if (!socioParam) return false;

      const socioId = Number(socioParam);
      if (!Number.isFinite(socioId)) return false;

      const idx = currentRoute.points.findIndex((p) => p.socioId === socioId);
      if (idx < 0) return false;

      const point = currentRoute.points[idx];
      setSelectedId(point.id);
      setCardIndex(idx);
      setWelcomeOpen(false);
      setSheetExpanded(true);
      return true;
    },
    [searchParams]
  );

  const applyLocationUpdate = useCallback((location: UserMapLocation) => {
    setUserLocation((prev) => {
      if (prev && haversineDistanceKm(prev, location) < 0.008) {
        const nextHeading =
          typeof location.heading === "number" && Number.isFinite(location.heading)
            ? location.heading
            : prev.heading;
        if (nextHeading === prev.heading && location.accuracy === prev.accuracy) {
          return prev;
        }
        return { ...prev, heading: nextHeading, accuracy: location.accuracy ?? prev.accuracy };
      }
      return {
        ...location,
        heading:
          typeof location.heading === "number" && Number.isFinite(location.heading)
            ? location.heading
            : prev?.heading ?? null,
      };
    });
    setGeoModalOpen(false);
  }, []);

  const applyInitialRouteFromLocation = useCallback(
    (location: UserMapLocation) => {
      applyLocationUpdate(location);
      if (hasAutoRoutedRef.current) return;

      if (hasSocioDeepLink && focusSocioOnRoute(initialRoute)) {
        hasAutoRoutedRef.current = true;
        return;
      }

      const reordered = buildWalkingItinerary(location, initialRoute);
      setRoute(reordered);
      if (!focusSocioOnRoute(reordered)) {
        const start = reordered.points[0];
        if (start) {
          setSelectedId(start.id);
          setCardIndex(0);
        }
      }
      hasAutoRoutedRef.current = true;
    },
    [applyLocationUpdate, focusSocioOnRoute, hasSocioDeepLink, initialRoute]
  );

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoModalOpen(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyInitialRouteFromLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading:
            typeof pos.coords.heading === "number" && Number.isFinite(pos.coords.heading)
              ? pos.coords.heading
              : null,
        });
      },
      () => setGeoModalOpen(true),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 }
    );
  }, [applyInitialRouteFromLocation]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoModalOpen(true);
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      const heading =
        typeof pos.coords.heading === "number" && Number.isFinite(pos.coords.heading)
          ? pos.coords.heading
          : null;
      const location: UserMapLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading,
      };

      if (!hasAutoRoutedRef.current) {
        applyInitialRouteFromLocation(location);
      } else {
        applyLocationUpdate(location);
      }
    };

    const onError = () => setGeoModalOpen(true);

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 12_000,
      maximumAge: 30_000,
    });

    const watchId = navigator.geolocation.watchPosition(onSuccess, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 2_000,
      timeout: 25_000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [applyInitialRouteFromLocation, applyLocationUpdate]);

  useEffect(() => {
    const readCompassHeading = (event: DeviceOrientationEvent) => {
      const webkitHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number })
        .webkitCompassHeading;
      let heading: number | null = null;
      if (typeof webkitHeading === "number" && Number.isFinite(webkitHeading)) {
        heading = webkitHeading;
      } else if (typeof event.alpha === "number" && Number.isFinite(event.alpha)) {
        heading = (360 - event.alpha) % 360;
      }
      if (heading == null) return;
      setUserLocation((prev) => {
        if (!prev) return prev;
        if (prev.heading != null && Math.abs(prev.heading - heading!) < 2) return prev;
        return { ...prev, heading };
      });
    };

    window.addEventListener("deviceorientationabsolute", readCompassHeading, true);
    window.addEventListener("deviceorientation", readCompassHeading, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", readCompassHeading, true);
      window.removeEventListener("deviceorientation", readCompassHeading, true);
    };
  }, []);

  useEffect(() => {
    if (hasSocioDeepLink) {
      focusSocioOnRoute(initialRoute);
    }
  }, [focusSocioOnRoute, hasSocioDeepLink, initialRoute]);

  useEffect(() => {
    focusSocioOnRoute(route);
  }, [focusSocioOnRoute, route]);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    const updateHeight = () => {
      setBottomSheetHeight(el.getBoundingClientRect().height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sheetExpanded, welcomeOpen]);

  const selectedIndex = useMemo(
    () => route.points.findIndex((p) => p.id === selectedId),
    [route.points, selectedId]
  );

  const activeCardIndex = Math.max(0, selectedIndex >= 0 ? selectedIndex : cardIndex);
  const activePoint = route.points[activeCardIndex] ?? route.points[0];
  const stampHref = activePoint ? getPointStampHref(activePoint) : null;

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
    setWelcomeOpen(false);
    setCardIndex(wrapped);
    setSelectedId(route.points[wrapped].id);
  }

  const openNativeCamera = useCallback(() => {
    setScannerOpen(true);
  }, []);

  const onSheetTouchStart = (event: React.TouchEvent) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const onSheetTouchEnd = (event: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const endY = event.changedTouches[0]?.clientY;
    if (endY == null) return;
    const delta = touchStartY.current - endY;
    if (delta > 48) setSheetExpanded(true);
    else if (delta < -48) setSheetExpanded(false);
    touchStartY.current = null;
  };

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
            onClick={openNativeCamera}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-lg transition active:scale-95 animate-soft-glow"
          >
            <Camera className="w-4 h-4" />
            Abrir pasaporte
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
      <NavArrowButton direction="prev" onClick={() => goToIndex(activeCardIndex - 1)} />
      <div className="flex-1 text-center min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Siguiente parada</p>
        <p className="text-sm font-semibold text-slate-800 truncate">
          {route.points[(activeCardIndex + 1) % route.points.length]?.name ?? "Fin del recorrido"}
        </p>
      </div>
      <NavArrowButton direction="next" primary onClick={() => goToIndex(activeCardIndex + 1)} />
    </div>
  );

  return (
    <div className="relative h-full w-full overflow-hidden overscroll-none">
      <div className="absolute inset-0">
        <MapRouteMap
          points={route.points}
          walkPath={route.walkPath}
          highlightedId={welcomeOpen ? null : selectedId}
          userLocation={userLocation}
          immersive
          bottomSheetHeight={sheetExpanded ? bottomSheetHeight : 0}
          showStampPopups={!welcomeOpen}
          onPointSelect={selectPoint}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 px-2 sm:px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div
          ref={sheetRef}
          className={`max-w-lg mx-auto bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-2xl overflow-hidden transition-[max-height] duration-300 ease-out overscroll-contain ${
            sheetExpanded
              ? welcomeOpen
                ? "max-h-[min(62vh,480px)]"
                : "max-h-[min(52vh,420px)]"
              : welcomeOpen
                ? "max-h-[9.5rem]"
                : "max-h-[6.5rem]"
          }`}
          onTouchStart={onSheetTouchStart}
          onTouchEnd={onSheetTouchEnd}
        >
          <button
            type="button"
            onClick={() => setSheetExpanded((v) => !v)}
            className={`w-full flex justify-center touch-manipulation ${
              sheetExpanded ? "pt-2.5 pb-1 border-b border-slate-100/80" : "pt-2.5 pb-2"
            }`}
            aria-expanded={sheetExpanded}
            aria-label={sheetExpanded ? "Ocultar ficha" : "Mostrar ficha"}
          >
            <span className="w-10 h-1 rounded-full bg-slate-300" />
          </button>

          {!sheetExpanded && (
            <div className="px-2 pb-2.5">
              {!welcomeOpen ? (
                <div className="flex items-center gap-1.5">
                  <NavArrowButton
                    direction="prev"
                    onClick={() => goToIndex(activeCardIndex - 1)}
                  />
                  <div className="flex-1 min-w-0 text-center px-1">
                    {activePoint && (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                          Hito {activePoint.order} de {route.points.length}
                        </p>
                        <p className="text-sm font-semibold text-[#27366D] truncate leading-tight mt-0.5">
                          {activePoint.name}
                        </p>
                      </>
                    )}
                  </div>
                  <NavArrowButton
                    direction="next"
                    primary
                    onClick={() => goToIndex(activeCardIndex + 1)}
                  />
                </div>
              ) : (
                <div className="space-y-2 px-1">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                      Bienvenido al MAP
                    </p>
                    <p className="text-sm font-semibold text-[#27366D] truncate leading-tight mt-0.5">
                      Museo Abierto de Puebla
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setWelcomeOpen(false);
                      setSheetExpanded(true);
                    }}
                    className="w-full bg-[#27366D] hover:bg-[#1e2b58] text-white text-[11px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition active:scale-[0.98]"
                  >
                    Comenzar recorrido
                  </button>
                </div>
              )}
            </div>
          )}

          <div
            className={`p-3.5 space-y-2.5 overflow-y-auto overscroll-contain touch-pan-y ${
              sheetExpanded ? "max-h-[min(calc(58vh-2.5rem),440px)]" : "hidden"
            }`}
          >
            {welcomeOpen ? (
              <MapWelcomeFicha route={initialRoute} onStart={() => setWelcomeOpen(false)} />
            ) : (
              <>
                {fichaBody}
                {navRow}
                <p className="text-center">
                  <Link
                    href="/planes?tipo=comerciales#gran_empresa"
                    className="text-[10px] text-slate-400 hover:text-[#27366D] transition underline decoration-dotted underline-offset-2"
                  >
                    ¿Quieres estar en el MAP? Regístrate aquí.
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <MapGeoModal
        open={geoModalOpen}
        onClose={() => setGeoModalOpen(false)}
        onRetry={requestGeolocation}
      />

      <QrScanModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        hint="Apunta al QR del negocio o hito. Se lee solo al enfocar, sin tomar foto."
        fallbackHref="/pasaporte"
      />
    </div>
  );
}
