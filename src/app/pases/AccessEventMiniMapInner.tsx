"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const PUEBLA_CENTER: [number, number] = [19.043, -98.198];

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="background:#27366D;width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fbbf24;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 18],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 16, { animate: false });
    // Contenedor con aspect-ratio: Leaflet necesita invalidar tamaño al montar.
    const id = window.setTimeout(() => map.invalidateSize(), 50);
    return () => window.clearTimeout(id);
  }, [lat, lng, map]);
  return null;
}

export default function AccessEventMiniMapInner({
  latitude = null,
  longitude = null,
}: {
  venue: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const hasCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const center = useMemo(
    (): [number, number] => (hasCoords ? [latitude!, longitude!] : PUEBLA_CENTER),
    [hasCoords, latitude, longitude]
  );

  return (
    <div className="relative z-0 isolate overflow-hidden rounded-xl border border-slate-200 bg-slate-100 aspect-[16/10]">
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full !z-0"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} icon={pinIcon} />
        <Recenter lat={center[0]} lng={center[1]} />
      </MapContainer>
    </div>
  );
}
