import Image from "next/image";
import { SEASONAL_STAMP_SUBTITLE } from "@/lib/map-point-stamp";

/**
 * Mismo sello dorado del popup MAPA (`MapStampPreview` original):
 * logo + "Chiles en Nogada" (sin la etiqueta "Temporada").
 */
const SIZE = {
  /** Celda densa del pasaporte (escritorio / páginas internas). */
  sm: {
    box: "w-[4.75rem] h-[4.75rem] sm:w-[5.25rem] sm:h-[5.25rem]",
    img: 32,
    imgClass: "w-8 h-8",
    text: "text-[7px] sm:text-[8px]",
  },
  /** Portada móvil / tamaño intermedio. */
  md: {
    box: "w-[5.25rem] h-[5.25rem]",
    img: 36,
    imgClass: "w-9 h-9",
    text: "text-[8px]",
  },
  /** Popup MAPA (referencia visual). */
  lg: {
    box: "w-[5.5rem] h-[5.5rem]",
    img: 40,
    imgClass: "w-9 h-9",
    text: "text-[8px]",
  },
} as const;

type Size = keyof typeof SIZE;

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
      className={`${s.box} shrink-0 rounded-full flex flex-col items-center justify-center p-2 shadow-lg border-[3px] border-amber-700 ${className}`}
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
        className={`${s.text} font-black text-stone-900 leading-tight text-center mt-0.5 px-0.5`}
      >
        {subtitle}
      </span>
    </div>
  );
}
