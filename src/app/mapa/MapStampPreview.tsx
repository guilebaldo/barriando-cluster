import Image from "next/image";
import type { StampDisplayInfo } from "@/lib/map-point-stamp";

/** Sello dorado flotante sin recuadro ni texto lateral. */
export default function MapStampPreview({ stamp }: { stamp: StampDisplayInfo }) {
  return (
    <div className="flex justify-center mt-2">
      <div
        className="shrink-0 w-[5.5rem] h-[5.5rem] rounded-full flex flex-col items-center justify-center p-2 -rotate-6 shadow-lg border-[3px] border-amber-700 animate-float-y"
        style={{
          background: "linear-gradient(145deg, #fbbf24 0%, #f59e0b 45%, #d97706 100%)",
        }}
      >
        <Image
          src={stamp.logoSrc}
          alt=""
          width={40}
          height={40}
          className="w-9 h-9 object-contain"
          unoptimized
        />
        <span className="text-[7px] font-extrabold uppercase tracking-wider text-amber-950/80 mt-0.5">
          Temporada
        </span>
        <span className="text-[8px] font-black text-stone-900 leading-tight text-center">
          {stamp.subtitle}
        </span>
      </div>
    </div>
  );
}
