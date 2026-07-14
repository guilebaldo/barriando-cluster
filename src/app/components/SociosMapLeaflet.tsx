"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Socio } from "../data/socios";
import { resolveSocioMapCoord } from "@/lib/socio-map-coords";

function makeIcon(selected: boolean, hasBenefit: boolean) {
  const size = selected ? 20 : 11;
  const fill = selected ? "#4a5f9e" : "#27366D";
  const stroke = hasBenefit ? "#fbbf24" : selected ? "#fbbf24" : "#1e2b58";
  const border = selected ? 3 : hasBenefit ? 2 : 1;
  const pulse = selected
    ? "box-shadow:0 0 0 6px rgba(251,191,36,.45),0 0 0 12px rgba(251,191,36,.2);"
    : "box-shadow:0 1px 4px rgba(0,0,0,.3);";

  return L.divIcon({
    className: selected ? "map-marker-highlight" : "",
    html: `<div style="background:${fill};width:${size}px;height:${size}px;border-radius:50%;border:${border}px solid ${stroke};${pulse}transition:transform .2s ease"></div>`,
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
    map.flyTo([point.lat, point.lng], 17, { duration: 0.55 });
    const offsetY = bottomSheetHeight > 0 ? Math.round(bottomSheetHeight * 0.55) : 0;
    if (offsetY > 0) {
      window.setTimeout(() => map.panBy([0, offsetY], { animate: true }), 560);
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

function SocioMarker({
  lat,
  lng,
  socio,
  selected,
  onSelect,
}: {
  lat: number;
  lng: number;
  socio: Socio;
  selected: boolean;
  onSelect?: (id: number) => void;
}) {
  const icon = useMemo(
    () => makeIcon(selected, Boolean(socio.benefit)),
    [selected, socio.benefit]
  );

  return (
    <>
      {selected && (
        <Circle
          center={[lat, lng]}
          radius={45}
          pathOptions={{
            color: "#fbbf24",
            fillColor: "#fbbf24",
            fillOpacity: 0.15,
            weight: 2,
            opacity: 0.85,
          }}
        />
      )}
      <Marker
        position={[lat, lng]}
        icon={icon}
        zIndexOffset={selected ? 500 : 0}
        eventHandlers={{
          click: () => onSelect?.(socio.id),
        }}
      />
    </>
  );
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
          const coord = resolveSocioMapCoord(s);
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
          <SocioMarker
            key={p.socio.id}
            lat={p.lat}
            lng={p.lng}
            socio={p.socio}
            selected={selectedId === p.socio.id}
            onSelect={onSelect}
          />
        ))}
      </MapContainer>
    </div>
  );
}
