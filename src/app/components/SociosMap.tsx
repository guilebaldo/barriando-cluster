"use client";

import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { sociosCoords } from "../data/socios-coords";
import type { Socio } from "../data/socios";

const icon = L.divIcon({
  className: "",
  html: `<div style="background:#27366D;width:10px;height:10px;border-radius:50%;border:2px solid #fbbf24;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

export default function SociosMap({ socios }: { socios: Socio[] }) {
  const puntos = useMemo(
    () =>
      socios
        .map((s) => {
          const coord = sociosCoords[s.id];
          if (!coord) return null;
          return { ...coord, socio: s };
        })
        .filter(Boolean) as Array<{
        lat: number;
        lng: number;
        name: string;
        approx?: boolean;
        socio: Socio;
      }>,
    [socios]
  );

  if (puntos.length === 0) return null;

  const center: [number, number] = [19.0414, -98.2063];

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm h-[420px] z-0">
      <MapContainer center={center} zoom={15} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {puntos.map((p) => (
          <Marker key={p.socio.id} position={[p.lat, p.lng]} icon={icon}>
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-slate-900">{p.socio.name}</p>
                <p className="text-slate-500">{p.socio.categoria}</p>
                {p.socio.direccion && (
                  <a
                    href={p.socio.direccion}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#27366D] font-semibold underline mt-1 inline-block"
                  >
                    Ver en Maps
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
