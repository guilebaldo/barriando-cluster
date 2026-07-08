import Image from "next/image";
import type { StampDisplayInfo } from "@/lib/map-point-stamp";

export default function MapStampPreview({ stamp }: { stamp: StampDisplayInfo }) {
  return (
    <div className="flex items-center gap-4 mt-3 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/80 border border-amber-200/80">
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
      <div className="min-w-0 text-left">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
          {stamp.title}
        </p>
        <p className="text-sm font-semibold text-slate-800 mt-1 leading-snug">{stamp.businessName}</p>
        <p className="text-[11px] text-slate-600 mt-1 font-light leading-relaxed">
          Al escanear el QR recibes este sello dorado en tu Pasaporte Digital.
        </p>
      </div>
    </div>
  );
}
