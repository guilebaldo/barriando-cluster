"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { loadGoogleMapsApi } from "@/lib/google-maps-loader";
import { circuitViaWalkPath } from "@/lib/map-circuit";
import { buildMapMarkerPopupContent, pointHasScannableStamp } from "@/lib/map-point-stamp";
import type { MapRoutePoint } from "@/lib/map-route-client";

const LeafletMapFallback = dynamic(() => import("./MapRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[min(70vh,520px)] rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
  ),
});

export type UserMapLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

/** Centra el marcador en el espacio visible entre el borde superior del mapa y la ficha inferior. */
function getFocusPanOffsetPx(bottomSheetHeight: number, stampPopup: boolean): number {
  const sheetOffset = bottomSheetHeight > 0 ? bottomSheetHeight / 2 : 0;
  const popupOffset = stampPopup ? 64 : 0;
  return Math.round(sheetOffset + popupOffset);
}

export default function GoogleMapRouteMap({
  points,
  walkPath,
  highlightedId = null,
  fullScreen = false,
  immersive = false,
  bottomSheetHeight = 0,
  userLocation = null,
  onPointSelect,
}: {
  points: MapRoutePoint[];
  walkPath?: Array<[number, number]>;
  highlightedId?: string | null;
  fullScreen?: boolean;
  immersive?: boolean;
  bottomSheetHeight?: number;
  userLocation?: UserMapLocation | null;
  onPointSelect?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const googleRef = useRef<Awaited<ReturnType<typeof loadGoogleMapsApi>> | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const userAccuracyRef = useRef<google.maps.Circle | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const onSelectRef = useRef(onPointSelect);
  const highlightedIdRef = useRef(highlightedId);
  onSelectRef.current = onPointSelect;
  highlightedIdRef.current = highlightedId;

  const [error, setError] = useState<string | null>(null);
  const [useLeafletFallback, setUseLeafletFallback] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const resolvedWalkPath = useMemo(
    () => (walkPath && walkPath.length >= 2 ? walkPath : circuitViaWalkPath()),
    [walkPath]
  );

  useEffect(() => {
    if (useLeafletFallback || !containerRef.current || points.length === 0) return;
    let cancelled = false;

    loadGoogleMapsApi()
      .then((google) => {
        if (cancelled || !containerRef.current) return;

        googleRef.current = google;
        const center = { lat: points[0].latitude, lng: points[0].longitude };

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            center,
            zoom: 16,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: !fullScreen,
            zoomControl: true,
          });
        }

        if (!infoWindowRef.current) {
          infoWindowRef.current = new google.maps.InfoWindow({
            disableAutoPan: true,
            maxWidth: 220,
          });
        }

        setError(null);
        setMapReady(true);
      })
      .catch((err) => {
        console.error("[map] Google Maps failed:", err);
        setUseLeafletFallback(true);
      });

    return () => {
      cancelled = true;
    };
  }, [fullScreen, points.length, useLeafletFallback]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !googleRef.current || points.length === 0) return;

    const google = googleRef.current;
    const map = mapRef.current;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    points.forEach((point, idx) => {
      const isStart = idx === 0;
      const isHighlight = point.id === highlightedId;
      const isPremium = point.kind === "premium_business";
      const marker = new google.maps.Marker({
        map,
        position: { lat: point.latitude, lng: point.longitude },
        title: point.name,
        label: isHighlight
          ? { text: String(point.order), color: "#ffffff", fontWeight: "bold", fontSize: "12px" }
          : undefined,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isHighlight ? 12 : isStart ? 10 : isPremium ? 8 : 7,
          fillColor: isStart ? "#fbbf24" : isPremium ? "#27366D" : "#64748b",
          fillOpacity: 1,
          strokeColor: isHighlight ? "#fbbf24" : "#ffffff",
          strokeWeight: isHighlight ? 3 : 2,
        },
        zIndex: isHighlight ? 1000 : idx,
      });

      marker.addListener("click", () => {
        onSelectRef.current?.(point.id);
        if (pointHasScannableStamp(point)) {
          infoWindowRef.current?.setContent(buildMapMarkerPopupContent(point));
          infoWindowRef.current?.open({ map, anchor: marker });
        } else {
          infoWindowRef.current?.close();
        }
      });

      markersRef.current.push(marker);
    });
  }, [mapReady, points, highlightedId]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !googleRef.current) return;

    const google = googleRef.current;
    const map = mapRef.current;

    if (userLocation) {
      const userPos = { lat: userLocation.latitude, lng: userLocation.longitude };
      if (!userMarkerRef.current) {
        userMarkerRef.current = new google.maps.Marker({
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: "#3b82f6",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
          zIndex: 2000,
          title: "Tu ubicación",
        });
      }
      userMarkerRef.current.setPosition(userPos);
      userMarkerRef.current.setMap(map);

      if (userLocation.accuracy && userLocation.accuracy > 0) {
        if (!userAccuracyRef.current) {
          userAccuracyRef.current = new google.maps.Circle({
            map,
            fillColor: "#3b82f6",
            fillOpacity: 0.12,
            strokeColor: "#3b82f6",
            strokeOpacity: 0.35,
            strokeWeight: 1,
          });
        }
        userAccuracyRef.current.setCenter(userPos);
        userAccuracyRef.current.setRadius(userLocation.accuracy);
        userAccuracyRef.current.setMap(map);
      }
    } else {
      userMarkerRef.current?.setMap(null);
      userAccuracyRef.current?.setMap(null);
    }
  }, [mapReady, userLocation]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !containerRef.current) return;

    const map = mapRef.current;
    const hp = highlightedId ? points.find((p) => p.id === highlightedId) : null;
    const hi = highlightedId ? points.findIndex((p) => p.id === highlightedId) : -1;
    const stampPopup = hp ? pointHasScannableStamp(hp) : false;

    const focusHighlighted = () => {
      if (!hp) return;
      map.panTo({ lat: hp.latitude, lng: hp.longitude });
      const verticalOffset = immersive ? getFocusPanOffsetPx(bottomSheetHeight, stampPopup) : 0;
      if (verticalOffset > 0) {
        map.panBy(0, verticalOffset);
      }
    };

    if (hp && hi >= 0) {
      focusHighlighted();
      if (!userLocation) map.setZoom(17);

      const marker = markersRef.current[hi];
      if (marker) {
        if (stampPopup) {
          window.setTimeout(() => {
            if (highlightedIdRef.current !== hp.id) return;
            infoWindowRef.current?.setContent(buildMapMarkerPopupContent(hp));
            infoWindowRef.current?.open({ map, anchor: marker });
          }, 120);
        } else {
          infoWindowRef.current?.close();
        }
      }
      return;
    }

    infoWindowRef.current?.close();

    if (!userLocation && points.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      for (const point of points) {
        bounds.extend({ lat: point.latitude, lng: point.longitude });
      }
      const bottomPad = bottomSheetHeight > 0 ? bottomSheetHeight + 32 : 48;
      map.fitBounds(bounds, { top: 48, right: 48, bottom: bottomPad, left: 48 });
    }
  }, [mapReady, highlightedId, points, immersive, bottomSheetHeight]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !googleRef.current || resolvedWalkPath.length < 2) return;

    polylineRef.current?.setMap(null);
    polylineRef.current = new google.maps.Polyline({
      map: mapRef.current,
      path: resolvedWalkPath.map(([lat, lng]) => ({ lat, lng })),
      strokeOpacity: 0,
      icons: [
        {
          icon: {
            path: "M 0,-1 0,1",
            strokeOpacity: 1,
            strokeColor: "#27366D",
            scale: 3,
          },
          offset: "0",
          repeat: "16px",
        },
      ],
    });

    return () => {
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
    };
  }, [mapReady, resolvedWalkPath]);

  if (points.length === 0) {
    return (
      <div className="h-[480px] rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center text-sm text-slate-500">
        No hay puntos de ruta disponibles.
      </div>
    );
  }

  if (useLeafletFallback) {
    return (
      <div className="space-y-2">
        <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Mapa alternativo (OpenStreetMap). Para Google Maps, verifica la API key y haz redeploy en Vercel.
        </p>
        <LeafletMapFallback
          points={points}
          walkPath={resolvedWalkPath}
          highlightedId={highlightedId}
          userLocation={userLocation}
          onPointSelect={onPointSelect}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative z-0 overflow-hidden ${
        immersive
          ? "h-full w-full border-0 shadow-none rounded-none"
          : fullScreen
            ? "h-[min(78vh,640px)] rounded-none md:rounded-2xl border border-slate-200 shadow-lg"
            : "h-[min(70vh,520px)] rounded-2xl border border-slate-200 shadow-lg"
      }`}
    >
      <div ref={containerRef} className="h-full w-full touch-manipulation" />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 text-xs text-red-700 p-4 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
