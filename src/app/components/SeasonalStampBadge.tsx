import Image from "next/image";
import { SEASONAL_STAMP_SUBTITLE } from "@/lib/map-point-stamp";

/**
 * Copia 1:1 del sello dorado original del popup MAPA:
 * logo + "Temporada" + "Chiles en Nogada".
 * Mismo tamaño en MAPA y Pasaporte.
 */
export default function SeasonalStampBadge({
  logoSrc,
  alt = "",
  subtitle = SEASONAL_STAMP_SUBTITLE,
  className = "",
}: {
  logoSrc: string;
  alt?: string;
  subtitle?: string;
  /** Ignorado: siempre el tamaño del MAPA (5.5rem). */
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div
      className={`shrink-0 w-[5.5rem] h-[5.5rem] rounded-full flex flex-col items-center justify-center p-2 shadow-lg border-[3px] border-amber-700 ${className}`}
      style={{
        background: "linear-gradient(145deg, #fbbf24 0%, #f59e0b 45%, #d97706 100%)",
      }}
    >
      <Image
        src={logoSrc}
        alt={alt}
        width={40}
        height={40}
        className="w-9 h-9 object-contain"
        unoptimized
      />
      <span className="text-[7px] font-extrabold uppercase tracking-wider text-amber-950/80 mt-0.5">
        Temporada
      </span>
      <span className="text-[8px] font-black text-stone-900 leading-tight text-center">
        {subtitle}
      </span>
    </div>
  );
}
