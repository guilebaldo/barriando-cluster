"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
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
    map.setView([lat, lng], Math.max(map.getZoom(), 16), { animate: true });
  }, [lat, lng, map]);
  return null;
}

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
  className?: string;
};

export default function LeafletLocationPicker({
  latitude,
  longitude,
  onChange,
  disabled = false,
  className = "",
}: Props) {
  const [ready, setReady] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [center, setCenter] = useState<[number, number]>(() =>
    latitude != null && longitude != null ? [latitude, longitude] : PUEBLA_CENTER
  );

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (latitude != null && longitude != null) {
      setCenter([latitude, longitude]);
      return;
    }
    if (!navigator.geolocation) {
      setGpsError("GPS no disponible. Centramos en el Centro Histórico; ajusta el pin.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(next);
        onChange(next[0], next[1]);
      },
      () => {
        setGpsError("No se pudo obtener GPS. Centramos en Puebla; mueve el pin a tu negocio.");
        setCenter(PUEBLA_CENTER);
        onChange(PUEBLA_CENTER[0], PUEBLA_CENTER[1]);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 }
    );
    // Solo al montar / sin coords iniciales
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markerPos = useMemo((): [number, number] => {
    if (latitude != null && longitude != null) return [latitude, longitude];
    return center;
  }, [latitude, longitude, center]);

  if (!ready) {
    return (
      <div
        className={`h-56 rounded-xl border border-slate-200 bg-slate-100 animate-pulse ${className}`}
      />
    );
  }

  return (
    <div className={className}>
      <div
        className={`relative z-0 isolate h-56 rounded-xl overflow-hidden border border-slate-200 ${
          disabled ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <MapContainer
          center={center}
          zoom={16}
          scrollWheelZoom={!disabled}
          className="h-full w-full !z-0"
          style={{ zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter lat={markerPos[0]} lng={markerPos[1]} />
          {!disabled ? <MapClickHandler onPick={onChange} /> : null}
          <Marker
            position={markerPos}
            icon={pinIcon}
            draggable={!disabled}
            eventHandlers={{
              dragend: (e) => {
                const m = e.target as L.Marker;
                const { lat, lng } = m.getLatLng();
                onChange(lat, lng);
              },
            }}
          />
        </MapContainer>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
        Toca el mapa o arrastra el pin para confirmar la ubicación. Lat {markerPos[0].toFixed(5)}, Lng{" "}
        {markerPos[1].toFixed(5)}.
      </p>
      {gpsError ? <p className="mt-1 text-[11px] text-amber-700">{gpsError}</p> : null}
    </div>
  );
}
