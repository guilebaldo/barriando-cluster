"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  ChevronRight,
  Landmark,
  MapPin,
  Sparkles,
} from "lucide-react";
import { buildWalkingItinerary, haversineDistanceKm, type MapRouteResult } from "@/lib/map-route-client";
import { getHitoIntro } from "@/lib/map-hito-intro";
import MapWelcomeFicha from "./MapWelcomeFicha";
import MapGeoModal from "./MapGeoModal";
import { MapBusinessSignupLink } from "./MapBusinessSignupLink";
import type { UserMapLocation } from "./user-map-location";
import { useAppMobileShell } from "@/app/components/AppBottomNav";

function describeGeoError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Bloqueaste el permiso de ubicación. Actívalo en Ajustes del navegador o de la app e intenta de nuevo.";
    case err.POSITION_UNAVAILABLE:
      return "No se pudo obtener tu posición. Revisa que el GPS / Ubicación del celular esté encendido en Ajustes.";
    case err.TIMEOUT:
      return "Se agotó el tiempo esperando el GPS. Enciende la ubicación en Ajustes y vuelve a intentar.";
    default:
      return "No se pudo usar tu ubicación. Revisa que el GPS esté activo e intenta de nuevo.";
  }
}

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
  const sheetChromeRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchFromScroller = useRef(false);
  const hasAutoRoutedRef = useRef(false);

  const [route, setRoute] = useState(initialRoute);
  const [selectedId, setSelectedId] = useState<string | null>(initialRoute.points[0]?.id ?? null);
  const [cardIndex, setCardIndex] = useState(0);
  const appShell = useAppMobileShell();
  const [geoModalOpen, setGeoModalOpen] = useState(false);
  const [geoDetail, setGeoDetail] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserMapLocation | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [maxSheetPx, setMaxSheetPx] = useState(640);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(0);

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

  useEffect(() => {
    const updateMaxHeight = () => {
      const safeTop =
        Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-top")
        ) || 0;
      const topGap = Math.max(72, safeTop + 56);
      const bottomGap = appShell ? 56 : 0;
      setMaxSheetPx(Math.max(360, Math.round(window.innerHeight - topGap - bottomGap)));
    };
    updateMaxHeight();
    window.addEventListener("resize", updateMaxHeight);
    return () => window.removeEventListener("resize", updateMaxHeight);
  }, [appShell]);

  const applyLocationUpdate = useCallback((location: UserMapLocation) => {
    setUserLocation((prev) => {
      if (prev && haversineDistanceKm(prev, location) < 0.008) {
        if (location.accuracy === prev.accuracy && location.speed === prev.speed) {
          return prev;
        }
        return {
          ...prev,
          accuracy: location.accuracy ?? prev.accuracy,
          speed: location.speed ?? prev.speed,
        };
      }
      return location;
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
      setGeoDetail("Este dispositivo no soporta geolocalización.");
      setGeoModalOpen(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoDetail(null);
        setGeoModalOpen(false);
        applyInitialRouteFromLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed:
            typeof pos.coords.speed === "number" && Number.isFinite(pos.coords.speed)
              ? pos.coords.speed
              : null,
        });
      },
      (err) => {
        setGeoDetail(describeGeoError(err));
        setGeoModalOpen(true);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 }
    );
  }, [applyInitialRouteFromLocation]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoDetail("Este dispositivo no soporta geolocalización.");
      setGeoModalOpen(true);
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setGeoDetail(null);
      const speed =
        typeof pos.coords.speed === "number" && Number.isFinite(pos.coords.speed)
          ? pos.coords.speed
          : null;
      const location: UserMapLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed,
      };

      if (!hasAutoRoutedRef.current) {
        applyInitialRouteFromLocation(location);
      } else {
        applyLocationUpdate(location);
      }
    };

    const onError = (err: GeolocationPositionError) => {
      setGeoDetail(describeGeoError(err));
      setGeoModalOpen(true);
    };

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
    if (hasSocioDeepLink) {
      focusSocioOnRoute(initialRoute);
    }
  }, [focusSocioOnRoute, hasSocioDeepLink, initialRoute]);

  useEffect(() => {
    focusSocioOnRoute(route);
  }, [focusSocioOnRoute, route]);

  useEffect(() => {
    const el = sheetChromeRef.current ?? sheetRef.current;
    if (!el) return;

    const updateHeight = () => {
      // Incluye padding inferior del chrome (ficha flotante sin hub).
      setBottomSheetHeight(el.getBoundingClientRect().height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sheetExpanded, welcomeOpen, maxSheetPx, selectedId, cardIndex, appShell]);

  const selectedIndex = useMemo(
    () => route.points.findIndex((p) => p.id === selectedId),
    [route.points, selectedId]
  );

  const activeCardIndex = Math.max(0, selectedIndex >= 0 ? selectedIndex : cardIndex);
  const activePoint = route.points[activeCardIndex] ?? route.points[0];
  const activeDescription = activePoint
    ? activePoint.description?.trim() || getHitoIntro(activePoint.name, activePoint.zone)
    : "";

  function selectPoint(id: string) {
    setWelcomeOpen(false);
    setSelectedId(id);
    const idx = route.points.findIndex((p) => p.id === id);
    if (idx >= 0) setCardIndex(idx);
    setSheetExpanded(true);
    bodyScrollRef.current?.scrollTo({ top: 0 });
  }

  function goToIndex(next: number) {
    const total = route.points.length;
    if (!total) return;
    const wrapped = ((next % total) + total) % total;
    setWelcomeOpen(false);
    setCardIndex(wrapped);
    setSelectedId(route.points[wrapped].id);
    bodyScrollRef.current?.scrollTo({ top: 0 });
  }

  const onSheetTouchStart = (event: React.TouchEvent) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
    const scroller = bodyScrollRef.current;
    const target = event.target;
    touchFromScroller.current = Boolean(
      scroller && target instanceof Node && scroller.contains(target)
    );
  };

  const onSheetTouchEnd = (event: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const endY = event.changedTouches[0]?.clientY;
    if (endY == null) {
      touchStartY.current = null;
      touchFromScroller.current = false;
      return;
    }
    const delta = touchStartY.current - endY;
    touchStartY.current = null;
    const fromScroller = touchFromScroller.current;
    touchFromScroller.current = false;

    if (delta > 28) {
      setSheetExpanded(true);
    } else if (delta < -28) {
      const scroller = bodyScrollRef.current;
      if (fromScroller && sheetExpanded && scroller && scroller.scrollTop > 2) {
        return;
      }
      setSheetExpanded(false);
    }
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

      <p className="text-sm text-slate-600 leading-relaxed font-light mt-3">
        {activeDescription}
      </p>

      {activePoint.category && (
        <p className="text-[11px] text-slate-500 mt-2 font-medium">{activePoint.category}</p>
      )}

      {activePoint.mapsUrl ? (
        <p className="mt-2">
          <a
            href={activePoint.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[12px] text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-[#27366D]"
          >
            <MapPin className="w-3 h-3" />
            Google Maps
          </a>
        </p>
      ) : null}
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
    <div className="relative h-full w-full overflow-hidden overscroll-none flex lg:flex-row">
      <div className="relative flex-1 min-h-0 min-w-0">
        <div className="absolute inset-0">
          <MapRouteMap
            points={route.points}
            walkPath={route.walkPath}
            highlightedId={welcomeOpen ? null : selectedId}
            userLocation={userLocation}
            immersive
            bottomSheetHeight={bottomSheetHeight}
            showStampPopups={!welcomeOpen}
            onPointSelect={selectPoint}
          />
        </div>
      </div>

      <div
        ref={sheetChromeRef}
        className={`lg:hidden absolute left-0 right-0 bottom-0 z-20 ${
          appShell ? "px-0" : "px-2 sm:px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        }`}
      >
        <div
          ref={sheetRef}
          className={`mx-auto bg-white/95 backdrop-blur-sm border border-slate-200 shadow-2xl overflow-hidden flex flex-col min-h-0 transition-[height] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overscroll-contain will-change-[height] ${
            appShell
              ? "w-full max-w-none rounded-t-2xl border-b-0"
              : "max-w-lg rounded-2xl"
          }`}
          style={{
            height: "auto",
            maxHeight: maxSheetPx,
          }}
          onTouchStart={onSheetTouchStart}
          onTouchEnd={onSheetTouchEnd}
        >
          <button
            type="button"
            onClick={() => setSheetExpanded((v) => !v)}
            className={`w-full flex justify-center touch-manipulation shrink-0 ${
              sheetExpanded ? "pt-2.5 pb-1 border-b border-slate-100/80" : "pt-2.5 pb-2"
            }`}
            aria-expanded={sheetExpanded}
            aria-label={sheetExpanded ? "Ocultar ficha" : "Mostrar ficha"}
          >
            <span className="w-10 h-1 rounded-full bg-slate-300" />
          </button>

          {!sheetExpanded && (
            <div className="px-2 pb-2.5 shrink-0 space-y-2">
              {!welcomeOpen ? (
                <>
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
                  <p className="text-center">
                    <MapBusinessSignupLink />
                  </p>
                </>
              ) : (
                <div className="space-y-2 px-1">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                      Bienvenido al MAPA
                    </p>
                    <p className="text-sm font-semibold text-[#27366D] truncate leading-tight mt-0.5">
                      Museo Abierto de Puebla y Alrededores
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setWelcomeOpen(false);
                      setSheetExpanded(true);
                    }}
                    className="w-full bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition active:scale-[0.98]"
                  >
                    Comenzar recorrido
                  </button>
                  <p className="text-center">
                    <MapBusinessSignupLink />
                  </p>
                </div>
              )}
            </div>
          )}

          {sheetExpanded ? (
            <div
              ref={bodyScrollRef}
              className="p-3.5 space-y-2.5 overflow-y-auto overscroll-contain touch-pan-y min-h-0"
            >
              {welcomeOpen ? (
                <MapWelcomeFicha
                  route={initialRoute}
                  onStart={() => {
                    setWelcomeOpen(false);
                    setSheetExpanded(true);
                  }}
                />
              ) : (
                <>
                  {fichaBody}
                  {navRow}
                  <p className="text-center">
                    <MapBusinessSignupLink />
                  </p>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <aside className="hidden lg:flex w-[min(26rem,38vw)] xl:w-[28rem] shrink-0 flex-col min-h-0 bg-white border-l border-slate-200">
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-4">
          {welcomeOpen ? (
            <MapWelcomeFicha
              route={initialRoute}
              onStart={() => {
                setWelcomeOpen(false);
                setSheetExpanded(true);
              }}
            />
          ) : (
            <>
              {fichaBody}
              {navRow}
              <p className="text-center">
                <MapBusinessSignupLink />
              </p>
            </>
          )}
        </div>
      </aside>

      <MapGeoModal
        open={geoModalOpen}
        onClose={() => setGeoModalOpen(false)}
        onRetry={requestGeolocation}
        detail={geoDetail}
      />
    </div>
  );
}
