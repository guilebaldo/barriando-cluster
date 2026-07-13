"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { loadGoogleMapsApi } from "@/lib/google-maps-loader";
import type { Socio } from "../data/socios";
import { sociosCoords } from "../data/socios-coords";

const LeafletSociosMap = dynamic(() => import("./SociosMapLeaflet"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-100 animate-pulse" />,
});

type MapPoint = {
  lat: number;
  lng: number;
  socio: Socio;
};

function getFocusPanOffsetPx(bottomSheetHeight: number): number {
  return bottomSheetHeight > 0 ? Math.round(bottomSheetHeight / 2) : 0;
}

function markerIcon(
  google: typeof globalThis.google,
  selected: boolean
): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: selected ? 10 : 7,
    fillColor: selected ? "#f59e0b" : "#27366D",
    fillOpacity: 1,
    strokeColor: selected ? "#27366D" : "#fbbf24",
    strokeWeight: selected ? 3 : 2,
  };
}

export default function GoogleSociosMap({
  socios,
  selectedId = null,
  onSelect,
  immersive = false,
  bottomSheetHeight = 0,
}: {
  socios: Socio[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  immersive?: boolean;
  bottomSheetHeight?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const googleRef = useRef<Awaited<ReturnType<typeof loadGoogleMapsApi>> | null>(null);
  const markersRef = useRef<Map<number, google.maps.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  const selectedIdRef = useRef(selectedId);
  const [useLeafletFallback, setUseLeafletFallback] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  onSelectRef.current = onSelect;
  selectedIdRef.current = selectedId;

  const puntos: MapPoint[] = useMemo(
    () =>
      socios
        .map((s) => {
          const coord = sociosCoords[s.id];
          if (!coord) return null;
          return { lat: coord.lat, lng: coord.lng, socio: s };
        })
        .filter(Boolean) as MapPoint[],
    [socios]
  );

  useEffect(() => {
    if (useLeafletFallback || !containerRef.current) return;
    let cancelled = false;

    loadGoogleMapsApi()
      .then((google) => {
        if (cancelled || !containerRef.current) return;

        googleRef.current = google;
        const defaultCenter = puntos[0]
          ? { lat: puntos[0].lat, lng: puntos[0].lng }
          : { lat: 19.0414, lng: -98.2063 };

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            center: defaultCenter,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: !immersive,
            zoomControl: true,
            gestureHandling: immersive ? "greedy" : "auto",
          });
        }

        const map = mapRef.current;
        const nextIds = new Set(puntos.map((p) => p.socio.id));

        markersRef.current.forEach((marker, id) => {
          if (!nextIds.has(id)) {
            marker.setMap(null);
            markersRef.current.delete(id);
          }
        });

        puntos.forEach((p) => {
          const selected = selectedIdRef.current === p.socio.id;
          let marker = markersRef.current.get(p.socio.id);
          if (!marker) {
            marker = new google.maps.Marker({
              map,
              position: { lat: p.lat, lng: p.lng },
              title: p.socio.name,
              icon: markerIcon(google, selected),
            });
            marker.addListener("click", () => {
              onSelectRef.current?.(p.socio.id);
            });
            markersRef.current.set(p.socio.id, marker);
          } else {
            marker.setPosition({ lat: p.lat, lng: p.lng });
            marker.setIcon(markerIcon(google, selected));
            marker.setMap(map);
          }
        });

        setMapReady(true);
      })
      .catch((err) => {
        console.error("[socios-map] Google Maps failed:", err);
        setUseLeafletFallback(true);
      });

    return () => {
      cancelled = true;
    };
  }, [puntos, useLeafletFallback, immersive]);

  const fittedFilterKeyRef = useRef<string>("");

  useEffect(() => {
    const map = mapRef.current;
    const google = googleRef.current;
    if (!map || !google || !mapReady || selectedId != null || puntos.length === 0) return;

    const key = puntos.map((p) => p.socio.id).join(",");
    if (key === fittedFilterKeyRef.current) return;
    fittedFilterKeyRef.current = key;

    const bounds = new google.maps.LatLngBounds();
    puntos.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(bounds, {
      top: 48,
      right: 32,
      bottom: Math.max(48, bottomSheetHeight + 24),
      left: 32,
    });
  }, [puntos, selectedId, bottomSheetHeight, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const google = googleRef.current;
    if (!map || !google || !mapReady) return;

    markersRef.current.forEach((marker, id) => {
      marker.setIcon(markerIcon(google, id === selectedId));
      marker.setZIndex(id === selectedId ? 1000 : 1);
    });

    if (selectedId == null) return;
    const point = puntos.find((p) => p.socio.id === selectedId);
    if (!point) return;

    map.panTo({ lat: point.lat, lng: point.lng });
    if ((map.getZoom() ?? 15) < 16) {
      map.setZoom(16);
    }
    const offset = getFocusPanOffsetPx(bottomSheetHeight);
    if (offset > 0) {
      map.panBy(0, -offset);
    }
  }, [selectedId, bottomSheetHeight, puntos, mapReady]);

  if (useLeafletFallback) {
    return (
      <LeafletSociosMap
        socios={socios}
        selectedId={selectedId}
        onSelect={onSelect}
        immersive={immersive}
        bottomSheetHeight={bottomSheetHeight}
      />
    );
  }

  return (
    <div
      className={
        immersive
          ? "absolute inset-0 z-0"
          : "rounded-xl overflow-hidden border border-slate-200 shadow-sm h-[420px] z-0"
      }
    >
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
