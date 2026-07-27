"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSociosHrefForRestaurant } from "@/lib/pasaporte";
import SecurityPatternBackground from "@/components/ui/SecurityPatternBackground";

type RestaurantCard = {
  id: number;
  name: string;
  slug: string;
  foto: string;
  categoria: string;
  logoUrl?: string | null;
};

const STAMP_OUTLINE_COLORS = [
  "border-emerald-700",
  "border-red-600",
  "border-[#27366D]",
] as const;

const COVER_STAMP_COUNT = 6;
const PAGE_STAMP_COUNT = 8;
const SWIPE_THRESHOLD_PX = 56;

function stampTiltClass(id: number): string {
  const tilts = [
    "rotate-[-8deg]",
    "rotate-[6deg]",
    "rotate-[-4deg]",
    "rotate-[10deg]",
    "rotate-[-12deg]",
    "rotate-[4deg]",
  ];
  const idx = Math.abs((id * 2654435761) >>> 0) % tilts.length;
  return tilts[idx]!;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out.length > 0 ? out : [[]];
}

function StampCell({
  restaurant,
  index,
  hasStamp,
  count,
  isFlashing,
  large,
}: {
  restaurant: RestaurantCard;
  index: number;
  hasStamp: boolean;
  count?: number;
  isFlashing?: boolean;
  large?: boolean;
}) {
  const colorClass = STAMP_OUTLINE_COLORS[index % STAMP_OUTLINE_COLORS.length];
  const sizeClass = large
    ? "w-[5.75rem] h-[5.75rem] p-3"
    : "w-[5.25rem] h-[5.25rem] p-2.5";

  return (
    <Link
      href={getSociosHrefForRestaurant(restaurant.id)}
      data-stamp-id={restaurant.id}
      className={`flex flex-col items-center text-center gap-2 transition-opacity active:scale-[0.98] ${
        hasStamp ? "opacity-100" : "opacity-40"
      }`}
    >
      <div className="relative">
        <div
          className={`${sizeClass} rounded-full border-2 flex items-center justify-center bg-transparent transition-all duration-500 ${
            hasStamp
              ? `${colorClass} border-solid scale-100 ${stampTiltClass(restaurant.id)}`
              : "border-dashed border-stone-300 scale-95"
          } ${isFlashing ? "animate-stamp-press" : ""}`}
        >
          {hasStamp && (
            <Image
              src={restaurant.logoUrl?.trim() || `/logos/${restaurant.foto}.png`}
              alt={restaurant.name}
              width={72}
              height={72}
              className="w-full h-full object-contain"
              unoptimized
            />
          )}
        </div>
        {count != null && count > 1 && (
          <span className="absolute -top-1 -right-1 min-w-[1.15rem] h-4 px-1 rounded-full bg-[#27366D] text-white text-[9px] font-bold flex items-center justify-center shadow">
            x{count}
          </span>
        )}
      </div>
      <p className="text-[11px] font-medium text-stone-700 leading-tight line-clamp-2 px-1">
        {restaurant.name}
      </p>
    </Link>
  );
}

export default function PasaporteBookMobile({
  userName,
  userImage,
  restaurants,
  stampMap,
  totalStamps,
  uniqueStamped,
  totalRestaurants,
  tierLabel,
  tierId,
  progress,
  stampFlashId,
}: {
  userName: string;
  userImage: string | null;
  restaurants: RestaurantCard[];
  stampMap: Record<number, { count: number; lastStampAt: string }>;
  totalStamps: number;
  uniqueStamped: number;
  totalRestaurants: number;
  tierLabel: string;
  tierId: "turista" | "poblano";
  progress: number;
  stampFlashId: number | null;
}) {
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const coverStamps = useMemo(
    () => restaurants.slice(0, COVER_STAMP_COUNT),
    [restaurants]
  );
  const restPages = useMemo(
    () => chunk(restaurants.slice(COVER_STAMP_COUNT), PAGE_STAMP_COUNT),
    [restaurants]
  );
  const pageCount = 1 + (restaurants.length > COVER_STAMP_COUNT ? restPages.length : 0);

  const goTo = useCallback(
    (next: number) => {
      setPageIndex(Math.max(0, Math.min(pageCount - 1, next)));
      setDragOffset(0);
    },
    [pageCount]
  );

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? null;
    touchStartX.current = e.touches[0]?.clientX ?? null;
    setDragOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const startY = touchStartY.current;
    const startX = touchStartX.current;
    const y = e.touches[0]?.clientY;
    const x = e.touches[0]?.clientX;
    if (startY == null || startX == null || y == null || x == null) return;
    const dy = y - startY;
    const dx = x - startX;
    if (Math.abs(dx) > Math.abs(dy)) return;
    // Resist at edges
    if ((pageIndex === 0 && dy > 0) || (pageIndex >= pageCount - 1 && dy < 0)) {
      setDragOffset(dy * 0.25);
      return;
    }
    setDragOffset(dy);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const startY = touchStartY.current;
    touchStartY.current = null;
    touchStartX.current = null;
    const endY = e.changedTouches[0]?.clientY;
    if (startY == null || endY == null) {
      setDragOffset(0);
      return;
    }
    const dy = startY - endY; // positive = swipe up = next page
    if (dy > SWIPE_THRESHOLD_PX) goTo(pageIndex + 1);
    else if (dy < -SWIPE_THRESHOLD_PX) goTo(pageIndex - 1);
    else setDragOffset(0);
  };

  return (
    <div className="relative flex-1 min-h-0 w-full bg-[#faf6ef] text-slate-900 overflow-hidden overscroll-none select-none">
      <SecurityPatternBackground opacity={0.08} density={0.95} className="text-stone-500" />
      <div
        className="absolute inset-0 opacity-[0.18] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(160,120,60,0.06) 24px, rgba(160,120,60,0.06) 25px)",
        }}
      />

      <div
        className="relative z-10 h-full w-full touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="h-full w-full will-change-transform"
          style={{
            transform: `translateY(calc(-${pageIndex * 100}% + ${dragOffset}px))`,
            transition:
              dragOffset !== 0
                ? "none"
                : "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* —— Página 0: identidad + primeros sellos —— */}
          <section className="h-full w-full flex flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-14">
            <div className="shrink-0 border-b border-[#d9cdb3]/80 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-passport-mrz tracking-[0.35em] text-stone-500 uppercase">
                    Clúster Turístico de Puebla
                  </p>
                  <h1 className="text-xl font-black font-serif-cluster uppercase tracking-[0.12em] text-[#3d2914] leading-tight mt-0.5">
                    Pasaporte Digital
                  </h1>
                </div>
                <p className="passport-value text-[11px] leading-snug text-right shrink-0 max-w-[7.5rem]">
                  Puebla de Los Ángeles
                </p>
              </div>

              <div className="mt-4 flex gap-4">
                <div className="shrink-0 w-[5.75rem] h-[7.25rem] border-2 border-[#b8a88a] bg-[#ede6d8] overflow-hidden shadow-inner">
                  {userImage ? (
                    <Image
                      src={userImage}
                      alt={userName}
                      width={96}
                      height={120}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 bg-gradient-to-b from-[#f0ebe3] to-[#e4ddd0]">
                      <span className="text-2xl font-serif-cluster text-[#5c3d1e]/70">
                        {getInitials(userName) || "?"}
                      </span>
                      <span className="text-[8px] font-passport-mrz tracking-widest mt-1 uppercase">
                        Foto
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 grid grid-cols-[minmax(0,1fr)_5.5rem] gap-x-3 gap-y-2 pt-0.5">
                  <div className="space-y-2">
                    <div>
                      <p className="passport-label">Nombre</p>
                      <p className="passport-value text-sm leading-snug mt-0.5 break-words">
                        {userName}
                      </p>
                    </div>
                    <div>
                      <p className="passport-label">Temporada</p>
                      <p className="passport-value text-[11px] mt-0.5">Chiles en Nogada</p>
                    </div>
                    <div>
                      <p className="passport-label">Rango</p>
                      <p
                        className={`passport-value text-[11px] mt-0.5 flex items-center gap-1 ${
                          tierId === "poblano" ? "text-amber-900" : ""
                        }`}
                      >
                        {tierId === "poblano" && <span aria-hidden>★</span>}
                        {tierLabel.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 pl-2 border-l border-[#d9cdb3]/70">
                    <div>
                      <p className="passport-label">Sellos</p>
                      <p className="passport-value text-[11px] mt-0.5">{totalStamps}</p>
                    </div>
                    <div>
                      <p className="passport-label">Visitados</p>
                      <p className="passport-value text-[11px] mt-0.5">
                        {uniqueStamped}/{totalRestaurants}
                      </p>
                    </div>
                    <div>
                      <p className="passport-label">Progreso</p>
                      <p className="passport-value text-[11px] mt-0.5">{progress}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col pt-4">
              <p className="text-[10px] text-center text-stone-400/80 font-light tracking-wide mb-3 shrink-0">
                Desliza hacia arriba para más sellos
              </p>
              <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-4 content-start overflow-hidden">
                {coverStamps.map((restaurant, index) => {
                  const stamp = stampMap[restaurant.id];
                  return (
                    <StampCell
                      key={restaurant.id}
                      restaurant={restaurant}
                      index={index}
                      hasStamp={Boolean(stamp?.count)}
                      count={stamp?.count}
                      isFlashing={stampFlashId === restaurant.id}
                      large
                    />
                  );
                })}
              </div>
            </div>
          </section>

          {/* —— Páginas de sellos —— */}
          {restaurants.length > COVER_STAMP_COUNT &&
            restPages.map((page, pageIdx) => (
              <section
                key={`stamp-page-${pageIdx}`}
                className="h-full w-full flex flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-14"
              >
                <div className="shrink-0 flex items-center justify-between border-b border-[#d9cdb3]/70 pb-2 mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Sellos
                  </p>
                  <p className="text-[10px] font-passport-mrz text-stone-400 tabular-nums">
                    {pageIdx + 2} / {pageCount}
                  </p>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-5 content-start overflow-hidden">
                  {page.map((restaurant, index) => {
                    const globalIndex = COVER_STAMP_COUNT + pageIdx * PAGE_STAMP_COUNT + index;
                    const stamp = stampMap[restaurant.id];
                    return (
                      <StampCell
                        key={restaurant.id}
                        restaurant={restaurant}
                        index={globalIndex}
                        hasStamp={Boolean(stamp?.count)}
                        count={stamp?.count}
                        isFlashing={stampFlashId === restaurant.id}
                        large
                      />
                    );
                  })}
                </div>
              </section>
            ))}
        </div>
      </div>

      {pageCount > 1 && (
        <div
          className="absolute inset-x-0 bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))] z-20 flex justify-center gap-1.5 pb-1 pointer-events-none"
          aria-hidden
        >
          {Array.from({ length: pageCount }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === pageIndex ? "w-4 bg-[#27366D]" : "w-1.5 bg-stone-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
