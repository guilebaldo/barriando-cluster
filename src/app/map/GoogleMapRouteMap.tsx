"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsApi } from "@/lib/google-maps-loader";
import { buildGoogleWalkingPath } from "@/lib/google-walking-path";
import type { MapRoutePoint } from "@/lib/map-route-client";

export default function GoogleMapRouteMap({
  points,
  highlightedId = null,
  fullScreen = false,
}: {
  points: MapRoutePoint[];
  highlightedId?: string | null;
  fullScreen?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;
    let cancelled = false;

    loadGoogleMapsApi()
      .then(async (google) => {
        if (cancelled || !containerRef.current) return;

        const center = { lat: points[0].latitude, lng: points[0].longitude };
        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            center,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: !fullScreen,
          });
        }

        const map = mapRef.current;
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        const bounds = new google.maps.LatLngBounds();
        points.forEach((point, idx) => {
          const isStart = idx === 0;
          const isHighlight = point.id === highlightedId;
          const isPremium = point.kind === "premium_business";
          const marker = new google.maps.Marker({
            map,
            position: { lat: point.latitude, lng: point.longitude },
            title: point.name,
            label: isHighlight
              ? { text: String(point.order), color: "#1e293b", fontWeight: "bold" }
              : undefined,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: isHighlight ? 11 : isStart ? 9 : 7,
              fillColor: isStart ? "#fbbf24" : isPremium ? "#27366D" : "#64748b",
              fillOpacity: 1,
              strokeColor: isHighlight ? "#fbbf24" : "#ffffff",
              strokeWeight: isHighlight ? 3 : 2,
            },
            zIndex: isHighlight ? 1000 : idx,
          });
          markersRef.current.push(marker);
          bounds.extend({ lat: point.latitude, lng: point.longitude });
        });

        if (highlightedId) {
          const hp = points.find((p) => p.id === highlightedId);
          if (hp) {
            map.panTo({ lat: hp.latitude, lng: hp.longitude });
            map.setZoom(17);
          }
        } else {
          map.fitBounds(bounds, 48);
        }

        const walkPath = await buildGoogleWalkingPath(points);
        if (cancelled) return;

        polylineRef.current?.setMap(null);
        polylineRef.current = new google.maps.Polyline({
          map,
          path: walkPath.map(([lat, lng]) => ({ lat, lng })),
          strokeColor: "#27366D",
          strokeOpacity: 0.9,
          strokeWeight: 4,
        });
      })
      .catch((err) => {
        console.error("[map] Google Maps failed:", err);
        setError("No se pudo cargar el mapa. Verifica NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.");
      });

    return () => {
      cancelled = true;
    };
  }, [points, highlightedId, fullScreen]);

  if (points.length === 0) {
    return (
      <div className="h-[480px] rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center text-sm text-slate-500">
        No hay puntos de ruta disponibles.
      </div>
    );
  }

  return (
    <div
      className={`relative z-0 overflow-hidden border border-slate-200 shadow-lg ${
        fullScreen ? "h-[min(85vh,640px)] rounded-none md:rounded-2xl" : "h-[min(70vh,520px)] rounded-2xl"
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
