"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MuaapRoutePoint } from "@/lib/muaapRoute";

function FitRouteBounds({ points }: { points: MuaapRoutePoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
  }, [map, points]);

  return null;
}

const milestoneIcon = L.divIcon({
  className: "",
  html: `<div style="background:#64748b;width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const premiumIcon = L.divIcon({
  className: "",
  html: `<div style="background:#27366D;width:14px;height:14px;border-radius:50%;border:3px solid #fbbf24;box-shadow:0 2px 8px rgba(39,54,109,.45)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const startIcon = L.divIcon({
  className: "",
  html: `<div style="background:#fbbf24;width:16px;height:16px;border-radius:50%;border:3px solid #27366D;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function MuaapRouteMap({ points }: { points: MuaapRoutePoint[] }) {
  const polyline = useMemo(
    () => points.map((p) => [p.latitude, p.longitude] as [number, number]),
    [points]
  );

  const center = useMemo<[number, number]>(() => {
    if (points.length === 0) return [19.0414, -98.1984];
    const first = points[0];
    return [first.latitude, first.longitude];
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="h-[480px] rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center text-sm text-slate-500">
        No hay puntos de ruta disponibles.
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg h-[min(70vh,520px)] z-0">
      <MapContainer center={center} zoom={15} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitRouteBounds points={points} />
        <Polyline
          positions={polyline}
          pathOptions={{ color: "#27366D", weight: 4, opacity: 0.75, dashArray: "8 6" }}
        />
        {points.map((point, idx) => {
          const icon = idx === 0 ? startIcon : point.kind === "premium_business" ? premiumIcon : milestoneIcon;
          return (
            <Marker
              key={point.id}
              position={[point.latitude, point.longitude]}
              icon={icon}
            >
              <Popup>
                <div className="text-xs min-w-[10rem]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Parada {point.order}
                  </p>
                  <p className="font-bold text-slate-900 mt-0.5">{point.name}</p>
                  {point.category && <p className="text-slate-500 mt-1">{point.category}</p>}
                  <a
                    href={point.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#27366D] font-semibold underline mt-2 inline-block"
                  >
                    Abrir en Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
