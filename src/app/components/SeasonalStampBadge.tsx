import Image from "next/image";
import {
  SEASONAL_STAMP_BADGE_TEXT,
  SEASONAL_STAMP_LABEL,
} from "@/lib/map-point-stamp";

const SIZE = {
  sm: {
    box: "w-[4.25rem] h-[4.25rem] sm:w-20 sm:h-20",
    pad: "px-1 pt-1 pb-1.5",
    img: 28,
    imgClass: "w-6 h-6 sm:w-7 sm:h-7",
    label: "text-[5.5px] sm:text-[6px]",
    word: "text-[9px] sm:text-[10px]",
  },
  md: {
    box: "w-[5.05rem] h-[5.05rem]",
    pad: "px-1.5 pt-1.5 pb-2",
    img: 32,
    imgClass: "w-8 h-8",
    label: "text-[6.5px]",
    word: "text-[11px]",
  },
  lg: {
    box: "w-[5.5rem] h-[5.5rem]",
    pad: "px-1.5 pt-1.5 pb-2",
    img: 36,
    imgClass: "w-9 h-9",
    label: "text-[7px]",
    word: "text-[12px]",
  },
} as const;

type Size = keyof typeof SIZE;

/**
 * Sello dorado de temporada (mismo look que el popup del MAPA).
 * En la cara solo va la palabra corta "Nogada" para que no se corte.
 */
export default function SeasonalStampBadge({
  logoSrc,
  alt = "",
  badgeText = SEASONAL_STAMP_BADGE_TEXT,
  size = "lg",
  className = "",
}: {
  logoSrc: string;
  alt?: string;
  /** Palabra corta en el sello (default: Nogada). */
  badgeText?: string;
  size?: Size;
  className?: string;
}) {
  const s = SIZE[size];

  return (
    <div
      className={`${s.box} ${s.pad} shrink-0 rounded-full flex flex-col items-center justify-center overflow-hidden shadow-lg border-[3px] border-amber-700 ${className}`}
      style={{
        background: "linear-gradient(145deg, #fbbf24 0%, #f59e0b 45%, #d97706 100%)",
      }}
    >
      <Image
        src={logoSrc}
        alt={alt}
        width={s.img}
        height={s.img}
        className={`${s.imgClass} object-contain shrink-0`}
        unoptimized
      />
      <span
        className={`${s.label} font-extrabold uppercase tracking-wider text-amber-950/80 mt-0.5 leading-none shrink-0`}
      >
        {SEASONAL_STAMP_LABEL}
      </span>
      <span
        className={`${s.word} font-black text-stone-900 leading-none text-center tracking-tight shrink-0`}
      >
        {badgeText}
      </span>
    </div>
  );
}
