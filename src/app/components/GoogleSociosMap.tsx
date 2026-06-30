"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { loadGoogleMapsApi } from "@/lib/google-maps-loader";
import type { Socio } from "../data/socios";
import { sociosCoords } from "../data/socios-coords";

const LeafletSociosMap = dynamic(() => import("./SociosMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />
  ),
});

type MapPoint = {
  lat: number;
  lng: number;
  socio: Socio;
};

export default function GoogleSociosMap({ socios }: { socios: Socio[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [useLeafletFallback, setUseLeafletFallback] = useState(false);

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
    if (useLeafletFallback || !containerRef.current || puntos.length === 0) return;
    let cancelled = false;

    loadGoogleMapsApi()
      .then((google) => {
        if (cancelled || !containerRef.current) return;

        const center = { lat: puntos[0].lat, lng: puntos[0].lng };
        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            center,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
        }

        const map = mapRef.current;
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        if (!infoWindowRef.current) {
          infoWindowRef.current = new google.maps.InfoWindow();
        }

        const bounds = new google.maps.LatLngBounds();
        puntos.forEach((p) => {
          const marker = new google.maps.Marker({
            map,
            position: { lat: p.lat, lng: p.lng },
            title: p.socio.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: "#27366D",
              fillOpacity: 1,
              strokeColor: "#fbbf24",
              strokeWeight: 2,
            },
          });

          marker.addListener("click", () => {
            const content = document.createElement("div");
            content.className = "text-xs min-w-[10rem] max-w-[14rem]";
            content.innerHTML = `
              <p class="font-bold text-slate-900 leading-snug">${escapeHtml(p.socio.name)}</p>
              <p class="text-slate-500 mt-1">${escapeHtml(p.socio.categoria)}</p>
            `;
            if (p.socio.direccion) {
              const link = document.createElement("a");
              link.href = p.socio.direccion;
              link.target = "_blank";
              link.rel = "noreferrer";
              link.className = "text-[#27366D] font-semibold underline mt-2 inline-block";
              link.textContent = "Ver en Maps";
              content.appendChild(link);
            }
            infoWindowRef.current?.setContent(content);
            infoWindowRef.current?.open({ map, anchor: marker });
          });

          markersRef.current.push(marker);
          bounds.extend({ lat: p.lat, lng: p.lng });
        });

        map.fitBounds(bounds, { top: 32, right: 32, bottom: 32, left: 32 });
      })
      .catch((err) => {
        console.error("[socios-map] Google Maps failed:", err);
        setUseLeafletFallback(true);
      });

    return () => {
      cancelled = true;
    };
  }, [puntos, useLeafletFallback]);

  if (puntos.length === 0) return null;

  if (useLeafletFallback) {
    return (
      <div className="space-y-2">
        <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Mapa alternativo (OpenStreetMap). Para Google Maps, verifica la API key.
        </p>
        <LeafletSociosMap socios={socios} />
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm h-[420px] z-0">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
