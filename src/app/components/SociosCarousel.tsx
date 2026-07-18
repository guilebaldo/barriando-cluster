"use client";

import { useEffect, useRef, useState } from "react";
import type { Socio } from "../data/socios";

interface SociosCarouselProps {
  socios: Socio[];
}

const SWIPE_THRESHOLD_PX = 36;

export default function SociosCarousel({ socios }: SociosCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  const itemWidth = 272; // w-64 + gap
  const loopWidth = Math.max(itemWidth * socios.length, itemWidth);
  const speed = 42; // px/s

  // direction 1 → logos se desplazan a la izquierda; -1 → a la derecha
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function tick(ts: number) {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const delta = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      offsetRef.current += direction * speed * delta;
      if (offsetRef.current >= loopWidth) offsetRef.current -= loopWidth;
      if (offsetRef.current < 0) offsetRef.current += loopWidth;
      track!.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [direction, loopWidth]);

  function setDirectionFromClientX(clientX: number) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const { left, width } = viewport.getBoundingClientRect();
    if (width <= 0) return;
    const ratio = (clientX - left) / width;
    // Mitad derecha → logos hacia la derecha; mitad izquierda → hacia la izquierda
    setDirection(ratio >= 0.5 ? -1 : 1);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    suppressClickRef.current = false;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX == null) return;
    const endX = e.changedTouches[0]?.clientX;
    if (endX == null) return;
    const delta = endX - startX;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    suppressClickRef.current = true;
    // Deslizar a la derecha → logos hacia la derecha; a la izquierda → hacia la izquierda
    setDirection(delta > 0 ? -1 : 1);
  }

  function onCardClick(e: React.MouseEvent) {
    if (suppressClickRef.current) {
      e.preventDefault();
      suppressClickRef.current = false;
    }
  }

  const items = [...socios, ...socios];

  return (
    <div
      ref={viewportRef}
      className="relative touch-pan-y"
      onMouseMove={(e) => setDirectionFromClientX(e.clientX)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
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
              onClick={onCardClick}
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
