import SeasonalStampBadge from "@/app/components/SeasonalStampBadge";
import type { StampDisplayInfo } from "@/lib/map-point-stamp";

/** Sello dorado flotante sin recuadro ni texto lateral (popup MAPA). */
export default function MapStampPreview({ stamp }: { stamp: StampDisplayInfo }) {
  return (
    <div className="flex justify-center mt-2">
      <SeasonalStampBadge
        logoSrc={stamp.logoSrc}
        subtitle={stamp.subtitle}
        size="lg"
        className="-rotate-6 animate-float-y"
      />
    </div>
  );
}
