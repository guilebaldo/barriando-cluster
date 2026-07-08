import { getStampDisplayInfo } from "@/lib/map-point-stamp";
import type { MapRoutePoint } from "@/lib/map-route-client";
import MapStampPreview from "./MapStampPreview";

export default function MapMarkerPopup({ point }: { point: MapRoutePoint }) {
  const stamp = getStampDisplayInfo(point);

  return (
    <div className="text-xs min-w-[11rem] max-w-[15rem]">
      <p className="font-bold text-slate-900 leading-snug">{point.name}</p>

      {stamp ? (
        <>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mt-2">
            {stamp.title}
          </p>
          <MapStampPreview stamp={stamp} />
          <p className="text-[10px] text-slate-600 mt-2 leading-relaxed text-center">
            Escanea el QR en el local para recibir este sello en tu Pasaporte.
          </p>
        </>
      ) : (
        <>
          {point.category && <p className="text-slate-500 mt-1">{point.category}</p>}
          <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
            Hito del MAP. Usa la ficha inferior para avanzar en tu recorrido.
          </p>
        </>
      )}
    </div>
  );
}
