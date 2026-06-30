"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { loadGoogleMapsApi } from "@/lib/google-maps-loader";
import { buildGoogleWalkingPath } from "@/lib/google-walking-path";
import type { MapRoutePoint } from "@/lib/map-route-client";

const LeafletMapFallback = dynamic(() => import("./MapRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[min(70vh,520px)] rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
  ),
});

function buildInfoWindowContent(
  point: MapRoutePoint,
  idx: number,
  total: number,
  onNavigate: (direction: "prev" | "next") => void
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "text-xs min-w-[11rem] max-w-[16rem]";

  const title = document.createElement("p");
  title.className = "font-bold text-slate-900 leading-snug";
  title.textContent = point.name;
  wrapper.appendChild(title);

  if (point.category) {
    const category = document.createElement("p");
    category.className = "text-slate-500 mt-1";
    category.textContent = point.category;
    wrapper.appendChild(category);
  }

  const nav = document.createElement("div");
  nav.className = "flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100";

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.textContent = "⬅️";
  prevBtn.title = "Anterior";
  prevBtn.className = "px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40";
  prevBtn.disabled = idx <= 0;
  prevBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (idx > 0) onNavigate("prev");
  });

  const counter = document.createElement("span");
  counter.className = "text-[10px] text-slate-400 font-medium";
  counter.textContent = `${point.order} / ${total}`;

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.textContent = "➡️";
  nextBtn.title = "Siguiente";
  nextBtn.className = "px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40";
  nextBtn.disabled = idx >= total - 1;
  nextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (idx < total - 1) onNavigate("next");
  });

  nav.append(prevBtn, counter, nextBtn);
  wrapper.appendChild(nav);

  return wrapper;
}

export default function GoogleMapRouteMap({
  points,
  highlightedId = null,
  fullScreen = false,
  onPointSelect,
}: {
  points: MapRoutePoint[];
  highlightedId?: string | null;
  fullScreen?: boolean;
  onPointSelect?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
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

        if (!infoWindowRef.current) {
          infoWindowRef.current = new google.maps.InfoWindow();
        }

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

          marker.addListener("click", () => {
            onSelectRef.current?.(point.id);
            const content = buildInfoWindowContent(point, idx, points.length, (dir) => {
              const nextIdx = dir === "prev" ? idx - 1 : idx + 1;
              const next = points[nextIdx];
              if (next) onSelectRef.current?.(next.id);
            });
            infoWindowRef.current?.setContent(content);
            infoWindowRef.current?.open({ map, anchor: marker });
          });

          markersRef.current.push(marker);
          bounds.extend({ lat: point.latitude, lng: point.longitude });
        });

        if (highlightedId) {
          const hp = points.find((p) => p.id === highlightedId);
          const hi = points.findIndex((p) => p.id === highlightedId);
          if (hp && hi >= 0) {
            map.panTo({ lat: hp.latitude, lng: hp.longitude });
            map.setZoom(17);
            const marker = markersRef.current[hi];
            if (marker) {
              const content = buildInfoWindowContent(hp, hi, points.length, (dir) => {
                const nextIdx = dir === "prev" ? hi - 1 : hi + 1;
                const next = points[nextIdx];
                if (next) onSelectRef.current?.(next.id);
              });
              infoWindowRef.current?.setContent(content);
              infoWindowRef.current?.open({ map, anchor: marker });
            }
          }
        } else {
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
            strokeColor: "#27366D",
            strokeOpacity: 0.9,
            strokeWeight: 4,
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
  }, [points, highlightedId, fullScreen, useLeafletFallback]);

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
          onPointSelect={onPointSelect}
        />
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
