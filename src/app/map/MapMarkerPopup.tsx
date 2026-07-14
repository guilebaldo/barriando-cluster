import { getStampDisplayInfo } from "@/lib/map-point-stamp";
import type { MapRoutePoint } from "@/lib/map-route-client";
import MapStampPreview from "./MapStampPreview";

export default function MapMarkerPopup({ point }: { point: MapRoutePoint }) {
  const stamp = getStampDisplayInfo(point);

  return (
    <div className="text-xs min-w-[8rem] max-w-[12rem] text-center">
      <p className="font-bold text-slate-900 leading-snug">{point.name}</p>
      {stamp ? <MapStampPreview stamp={stamp} /> : null}
    </div>
  );
}
