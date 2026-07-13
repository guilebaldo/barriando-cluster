"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { sociosCoords } from "../data/socios-coords";
import type { Socio } from "../data/socios";

function makeIcon(selected: boolean) {
  const size = selected ? 14 : 10;
  const fill = selected ? "#f59e0b" : "#27366D";
  const stroke = selected ? "#27366D" : "#fbbf24";
  return L.divIcon({
    className: "",
    html: `<div style="background:${fill};width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${stroke};box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FocusSelected({
  selectedId,
  puntos,
  bottomSheetHeight,
}: {
  selectedId: number | null;
  puntos: Array<{ lat: number; lng: number; socio: Socio }>;
  bottomSheetHeight: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedId == null) return;
    const point = puntos.find((p) => p.socio.id === selectedId);
    if (!point) return;
    const offsetY = bottomSheetHeight > 0 ? bottomSheetHeight / 2 : 0;
    map.setView([point.lat, point.lng], Math.max(map.getZoom(), 16), { animate: true });
    if (offsetY > 0) {
      map.panBy([0, -offsetY], { animate: true });
    }
  }, [selectedId, bottomSheetHeight, puntos, map]);

  return null;
}

function FitAllOnce({
  puntos,
  bottomSheetHeight,
}: {
  puntos: Array<{ lat: number; lng: number; socio: Socio }>;
  bottomSheetHeight: number;
}) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (fittedRef.current || puntos.length === 0) return;
    fittedRef.current = true;
    const bounds = L.latLngBounds(puntos.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, {
      paddingBottomRight: [24, Math.max(24, bottomSheetHeight + 16)],
      paddingTopLeft: [24, 48],
    });
  }, [puntos, bottomSheetHeight, map]);

  return null;
}

export default function SociosMapLeaflet({
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
  const puntos = useMemo(
    () =>
      socios
        .map((s) => {
          const coord = sociosCoords[s.id];
          if (!coord) return null;
          return { lat: coord.lat, lng: coord.lng, socio: s };
        })
        .filter(Boolean) as Array<{ lat: number; lng: number; socio: Socio }>,
    [socios]
  );

  const center: [number, number] = puntos[0]
    ? [puntos[0].lat, puntos[0].lng]
    : [19.0414, -98.2063];

  return (
    <div
      className={
        immersive
          ? "absolute inset-0 z-0"
          : "rounded-xl overflow-hidden border border-slate-200 shadow-sm h-[420px] z-0"
      }
    >
      <MapContainer center={center} zoom={15} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitAllOnce puntos={puntos} bottomSheetHeight={bottomSheetHeight} />
        <FocusSelected
          selectedId={selectedId}
          puntos={puntos}
          bottomSheetHeight={bottomSheetHeight}
        />
        {puntos.map((p) => (
          <Marker
            key={p.socio.id}
            position={[p.lat, p.lng]}
            icon={makeIcon(selectedId === p.socio.id)}
            eventHandlers={{
              click: () => onSelect?.(p.socio.id),
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
