"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { loadGoogleMapsApi } from "@/lib/google-maps-loader";
import { buildGoogleWalkingPath } from "@/lib/google-walking-path";
import { buildMapMarkerPopupContent } from "@/lib/map-point-stamp";
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

export default function GoogleMapRouteMap({
  points,
  highlightedId = null,
  fullScreen = false,
  userLocation = null,
  onPointSelect,
}: {
  points: MapRoutePoint[];
  highlightedId?: string | null;
  fullScreen?: boolean;
  userLocation?: UserMapLocation | null;
  onPointSelect?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const userAccuracyRef = useRef<google.maps.Circle | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const onSelectRef = useRef(onPointSelect);
  onSelectRef.current = onPointSelect;
  const [error, setError] = useState<string | null>(null);
  const [useLeafletFallback, setUseLeafletFallback] = useState(false);

  useEffect(() => {
    if (useLeafletFallback || !containerRef.current || points.length === 0) return;
    let cancelled = false;

    loadGoogleMapsApi()
      .then(async (google) => {
        if (cancelled || !containerRef.current) return;

        const center = userLocation
          ? { lat: userLocation.latitude, lng: userLocation.longitude }
          : { lat: points[0].latitude, lng: points[0].longitude };

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

        const map = mapRef.current;
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        if (!infoWindowRef.current) {
          infoWindowRef.current = new google.maps.InfoWindow();
        }

        const bounds = new google.maps.LatLngBounds();
        if (userLocation) {
          bounds.extend({ lat: userLocation.latitude, lng: userLocation.longitude });
        }

        points.forEach((point, idx) => {
          const isStart = idx === 0;
          const isHighlight = point.id === highlightedId;
          const isPremium = point.kind === "premium_business";
          const marker = new google.maps.Marker({
            map,
            position: { lat: point.latitude, lng: point.longitude },
            title: point.name,
            label: isHighlight
              ? { text: String(point.order), color: "#1e293b", fontWeight: "bold", fontSize: "11px" }
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
            infoWindowRef.current?.setContent(buildMapMarkerPopupContent(point));
            infoWindowRef.current?.open({ map, anchor: marker });
          });

          markersRef.current.push(marker);
          bounds.extend({ lat: point.latitude, lng: point.longitude });
        });

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

        if (highlightedId) {
          const hp = points.find((p) => p.id === highlightedId);
          const hi = points.findIndex((p) => p.id === highlightedId);
          if (hp && hi >= 0) {
            map.panTo({ lat: hp.latitude, lng: hp.longitude });
            if (!userLocation) map.setZoom(17);
            const marker = markersRef.current[hi];
            if (marker) {
              infoWindowRef.current?.setContent(buildMapMarkerPopupContent(hp));
              infoWindowRef.current?.open({ map, anchor: marker });
            }
          }
        } else if (!userLocation) {
          map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
        }

        setError(null);

        try {
          const walkPath = await buildGoogleWalkingPath(points);
          if (cancelled) return;

          polylineRef.current?.setMap(null);
          polylineRef.current = new google.maps.Polyline({
            map,
            path: walkPath.map(([lat, lng]) => ({ lat, lng })),
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
        } catch (pathErr) {
          console.warn("[map] Ruta peatonal no disponible, mostrando solo marcadores:", pathErr);
        }
      })
      .catch((err) => {
        console.error("[map] Google Maps failed:", err);
        setUseLeafletFallback(true);
      });

    return () => {
      cancelled = true;
    };
  }, [points, highlightedId, fullScreen, useLeafletFallback, userLocation]);

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
          highlightedId={highlightedId}
          userLocation={userLocation}
          onPointSelect={onPointSelect}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative z-0 overflow-hidden border border-slate-200 shadow-lg ${
        fullScreen ? "h-[min(78vh,640px)] rounded-none md:rounded-2xl" : "h-[min(70vh,520px)] rounded-2xl"
      }`}
    >
      <div ref={containerRef} className="h-full w-full" />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 text-xs text-red-700 p-4 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
