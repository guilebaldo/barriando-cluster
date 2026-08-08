import Image from "next/image";
import {
  SEASONAL_STAMP_LABEL,
  SEASONAL_STAMP_SUBTITLE,
} from "@/lib/map-point-stamp";

const SIZE = {
  sm: {
    box: "w-[4.25rem] h-[4.25rem] sm:w-20 sm:h-20",
    pad: "p-1.5",
    img: 36,
    imgClass: "w-8 h-8",
    label: "text-[6px]",
    subtitle: "text-[7px]",
  },
  md: {
    box: "w-[5.05rem] h-[5.05rem]",
    pad: "p-2",
    img: 40,
    imgClass: "w-9 h-9",
    label: "text-[7px]",
    subtitle: "text-[8px]",
  },
  lg: {
    box: "w-[5.5rem] h-[5.5rem]",
    pad: "p-2",
    img: 40,
    imgClass: "w-9 h-9",
    label: "text-[7px]",
    subtitle: "text-[8px]",
  },
} as const;

type Size = keyof typeof SIZE;

/**
 * Sello dorado de temporada (mismo look que el popup del MAPA).
 * El logo del negocio va dentro; no reemplaza el sello por el logo solo.
 */
export default function SeasonalStampBadge({
  logoSrc,
  alt = "",
  subtitle = SEASONAL_STAMP_SUBTITLE,
  size = "lg",
  className = "",
}: {
  logoSrc: string;
  alt?: string;
  subtitle?: string;
  size?: Size;
  className?: string;
}) {
  const s = SIZE[size];

  return (
    <div
      className={`${s.box} ${s.pad} shrink-0 rounded-full flex flex-col items-center justify-center shadow-lg border-[3px] border-amber-700 ${className}`}
      style={{
        background: "linear-gradient(145deg, #fbbf24 0%, #f59e0b 45%, #d97706 100%)",
      }}
    >
      <Image
        src={logoSrc}
        alt={alt}
        width={s.img}
        height={s.img}
        className={`${s.imgClass} object-contain`}
        unoptimized
      />
      <span
        className={`${s.label} font-extrabold uppercase tracking-wider text-amber-950/80 mt-0.5 leading-none`}
      >
        {SEASONAL_STAMP_LABEL}
      </span>
      <span
        className={`${s.subtitle} font-black text-stone-900 leading-tight text-center line-clamp-2 px-0.5`}
      >
        {subtitle}
      </span>
    </div>
  );
}
