"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Socio } from "../data/socios";

interface SociosCarouselProps {
  socios: Socio[];
}

export default function SociosCarousel({ socios }: SociosCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const itemWidth = 272; // w-64 + gap
  const loopWidth = itemWidth * socios.length;
  const speed = 42; // px/s

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function tick(ts: number) {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const delta = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      if (!isPaused) {
        offsetRef.current += direction * speed * delta;
        if (offsetRef.current >= loopWidth) offsetRef.current -= loopWidth;
        if (offsetRef.current < 0) offsetRef.current += loopWidth;
        track!.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [direction, isPaused, loopWidth]);

  const items = [...socios, ...socios];

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <button
        type="button"
        aria-label="Invertir carrusel hacia la izquierda"
        onClick={() => setDirection(-1)}
        className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 border border-slate-200 shadow-md flex items-center justify-center text-[#27366D] opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        aria-label="Avanzar carrusel hacia la derecha"
        onClick={() => setDirection(1)}
        className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 border border-slate-200 shadow-md flex items-center justify-center text-[#27366D] opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="w-full overflow-hidden relative select-none py-1">
        <div
          ref={trackRef}
          className="flex gap-8 will-change-transform"
          style={{ width: "max-content" }}
        >
          {items.map((socio, index) => (
            <a
              href={`/socios?socio=${socio.id}`}
              key={`${socio.id}-${index}`}
              className="flex flex-col shrink-0 items-center group/card w-64"
            >
              <div className="w-full h-36 bg-white border border-slate-200/80 rounded-2xl p-6 flex items-center justify-center transition-all duration-300 shadow-sm group-hover/card:border-amber-400 group-hover/card:shadow-premium-hover bg-gradient-to-b from-white to-slate-50/30">
                <img
                  src={`/logos/${socio.foto}.png`}
                  alt={socio.name}
                  className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover/card:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <span className="text-xs font-bold text-slate-800 mt-3.5 block truncate w-full text-center group-hover/card:text-[#27366D] transition-colors tracking-wide">
                {socio.name}
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                {socio.categoria}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
