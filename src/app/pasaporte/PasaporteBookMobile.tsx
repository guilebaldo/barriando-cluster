"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSociosHrefForRestaurant } from "@/lib/pasaporte";
import PlanIntentCta from "@/app/components/PlanIntentCta";
import SeasonalStampBadge from "@/app/components/SeasonalStampBadge";

type RestaurantCard = {
  id: number;
  name: string;
  slug: string;
  foto: string;
  categoria: string;
  logoUrl?: string | null;
};

/** Primera página (mitad inferior): 2×2 */
const COVER_STAMP_COUNT = 4;
/** Páginas siguientes: 2×4 (= 4 arriba + 4 abajo) */
const PAGE_STAMP_COUNT = 8;
const SWIPE_THRESHOLD_PX = 52;
const MRZ_SLOTS = 20;

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

function PassportProgressTrack({
  animatedProgress,
  tierId,
}: {
  animatedProgress: number;
  tierId: "turista" | "poblano";
}) {
  const halfSlots = MRZ_SLOTS / 2;
  const filledSlots = Math.round((animatedProgress / 100) * MRZ_SLOTS);
  const filledColor = tierId === "poblano" ? "text-amber-700" : "text-[#27366D]";
  const emptyColor = "text-stone-300/90";

  function renderChevrons(startIndex: number, count: number) {
    return Array.from({ length: count }).map((_, offset) => {
      const index = startIndex + offset;
      return (
        <span key={index} className={index < filledSlots ? filledColor : emptyColor}>
          {"<"}
        </span>
      );
    });
  }

  return (
    <div
      className="mt-3 flex w-full items-center gap-1 font-passport-mrz text-[9px] font-bold tracking-[0.06em] select-none"
      role="progressbar"
      aria-valuenow={animatedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progreso del pasaporte: ${animatedProgress}%`}
    >
      <span className={`shrink-0 ${tierId === "turista" ? "text-[#27366D]" : "text-stone-500"}`}>
        TURISTA
      </span>
      <span
        className="flex min-w-0 flex-1 items-center justify-end gap-px text-[11px] leading-none"
        aria-hidden
      >
        {renderChevrons(0, halfSlots)}
      </span>
      <span
        className={`shrink-0 tabular-nums px-0.5 ${
          tierId === "poblano" ? "text-amber-700" : "text-[#27366D]"
        }`}
      >
        {animatedProgress}%
      </span>
      <span
        className="flex min-w-0 flex-1 items-center justify-start gap-px text-[11px] leading-none"
        aria-hidden
      >
        {renderChevrons(halfSlots, halfSlots)}
      </span>
      <span className={`shrink-0 ${tierId === "poblano" ? "text-amber-700" : "text-stone-500"}`}>
        POBLANO
      </span>
    </div>
  );
}

function StampCell({
  restaurant,
  hasStamp,
  count,
  isFlashing,
  size = "md",
}: {
  restaurant: RestaurantCard;
  hasStamp: boolean;
  count?: number;
  isFlashing?: boolean;
  size?: "md" | "sm";
}) {
  const stampSize = size === "sm" ? "w-[5.05rem] h-[5.05rem]" : "w-[5.5rem] h-[5.5rem]";
  const badgeSize = size === "sm" ? "md" : "lg";
  const nameClass =
    size === "sm"
      ? "text-[10px] max-w-[7rem]"
      : "text-[11px] max-w-[7.5rem]";
  const logoSrc = restaurant.logoUrl?.trim() || `/logos/${restaurant.foto}.png`;

  return (
    <Link
      href={getSociosHrefForRestaurant(restaurant.id)}
      data-stamp-id={restaurant.id}
      className={`flex flex-col items-center justify-center text-center gap-1.5 transition-opacity active:scale-[0.98] ${
        hasStamp ? "opacity-100" : "opacity-40"
      }`}
    >
      <div className="relative">
        {hasStamp ? (
          <SeasonalStampBadge
            logoSrc={logoSrc}
            alt={restaurant.name}
            size={badgeSize}
            className={`scale-100 transition-all duration-500 ${stampTiltClass(restaurant.id)} ${
              isFlashing ? "animate-stamp-press" : ""
            }`}
          />
        ) : (
          <div
            className={`${stampSize} rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center bg-transparent scale-95`}
          />
        )}
        {count != null && count > 1 && (
          <span className="absolute -top-1 -right-1 min-w-[1.15rem] h-4 px-1 rounded-full bg-[#27366D] text-white text-[9px] font-bold flex items-center justify-center shadow">
            x{count}
          </span>
        )}
      </div>
      <p className={`font-medium text-stone-700 leading-tight line-clamp-2 px-1 ${nameClass}`}>
        {restaurant.name}
      </p>
    </Link>
  );
}

/* —— Guilloché de página completa (estilo hoja interior de pasaporte) —— */

const GUILLOCHE_W = 390;
const GUILLOCHE_H = 800;

/**
 * Onda horizontal con envolvente de amplitud y un segundo armónico: la
 * amplitud varía a lo largo de x y el armónico rompe la sinusoide simple,
 * que es lo que da el trazo "labrado" de los billetes.
 */
function wavePath({
  baseY,
  amp,
  wavelength,
  phase,
  ampMod = 0,
  ampModWavelength = 200,
  harmonic = 0,
}: {
  baseY: number;
  amp: number;
  wavelength: number;
  phase: number;
  ampMod?: number;
  ampModWavelength?: number;
  /** Peso del 2º armónico (0-0.5): añade el detalle fino del guilloché */
  harmonic?: number;
}): string {
  const pts: string[] = [];
  for (let x = 0; x <= GUILLOCHE_W; x += 2.5) {
    const envelope = 1 + ampMod * Math.sin((2 * Math.PI * x) / ampModWavelength);
    const theta = (2 * Math.PI * x) / wavelength + phase;
    const y = baseY + amp * envelope * (Math.sin(theta) + harmonic * Math.sin(3 * theta + phase));
    pts.push(`${x},${y.toFixed(2)}`);
  }
  return `M${pts.join(" L")}`;
}

/** Anillo de roseta: círculo con radio modulado (lóbulos), clásico de pasaportes. */
function rosettePath(
  cx: number,
  cy: number,
  radius: number,
  lobeAmp: number,
  lobes: number,
  phase: number
): string {
  const pts: string[] = [];
  const steps = 140;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = radius + lobeAmp * Math.sin(lobes * t + phase);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`);
  }
  return `M${pts.join(" L")}Z`;
}

function PageBackdrop() {
  const { bands, drift, rosette } = useMemo(() => {
    // Bandas trenzadas: pares de ondas en contrafase que se cruzan formando
    // la "cadena" que recorre la hoja. Interlineado corto = trama cerrada.
    const bands: string[] = [];
    for (let y = 8; y < GUILLOCHE_H; y += 13) {
      const rowPhase = (y / 13) * 0.55;
      const common = { amp: 4.2, wavelength: 26, ampMod: 0.5, ampModWavelength: 118, harmonic: 0.3 };
      bands.push(wavePath({ ...common, baseY: y, phase: rowPhase }));
      bands.push(wavePath({ ...common, baseY: y, phase: rowPhase + Math.PI }));
    }

    // Capa de deriva: ondas más largas y suaves, rotadas unos grados,
    // en segundo tono para el moiré sutil.
    const drift: string[] = [];
    for (let y = -40; y < GUILLOCHE_H + 40; y += 19) {
      drift.push(
        wavePath({ baseY: y, amp: 6.5, wavelength: 74, phase: (y / 19) * 0.8, harmonic: 0.18 })
      );
    }

    // Roseta central: anillos concéntricos lobulados alternando fase.
    const rosette: string[] = [];
    for (let i = 0; i < 16; i++) {
      rosette.push(
        rosettePath(
          GUILLOCHE_W / 2,
          GUILLOCHE_H / 2,
          34 + i * 5.5,
          3 + (i % 2) * 1.8,
          18,
          i % 2 ? Math.PI / 18 : 0
        )
      );
    }

    return { bands, drift, rosette };
  }, []);

  return (
    <>
      <svg
        className="absolute inset-0 z-0 h-full w-full pointer-events-none select-none"
        viewBox={`0 0 ${GUILLOCHE_W} ${GUILLOCHE_H}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g fill="none" stroke="#6b5d45" strokeOpacity={0.075} strokeWidth={0.35}>
          {bands.map((d, i) => (
            <path key={`b-${i}`} d={d} />
          ))}
        </g>
        <g
          fill="none"
          stroke="#4e6f63"
          strokeOpacity={0.055}
          strokeWidth={0.35}
          transform={`rotate(-7 ${GUILLOCHE_W / 2} ${GUILLOCHE_H / 2})`}
        >
          {drift.map((d, i) => (
            <path key={`d-${i}`} d={d} />
          ))}
        </g>
        <g fill="none" stroke="#6b5d45" strokeOpacity={0.07} strokeWidth={0.35}>
          {rosette.map((d, i) => (
            <path key={`r-${i}`} d={d} />
          ))}
        </g>
      </svg>
      {/* Viñeta suave en los bordes para dar profundidad de papel */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 64px rgba(120,90,40,0.07)" }}
      />
    </>
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
  alreadyOnPassportRoster = false,
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
  alreadyOnPassportRoster?: boolean;
}) {
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  /** Últimas dos muestras del drag para estimar velocidad al soltar */
  const lastMove = useRef<{ y: number; t: number } | null>(null);
  const prevMove = useRef<{ y: number; t: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const coverStamps = useMemo(
    () => restaurants.slice(0, COVER_STAMP_COUNT),
    [restaurants]
  );
  const restPages = useMemo(
    () => chunk(restaurants.slice(COVER_STAMP_COUNT), PAGE_STAMP_COUNT),
    [restaurants]
  );
  const pageCount = 1 + (restaurants.length > COVER_STAMP_COUNT ? restPages.length : 0);

  /**
   * El arrastre se aplica directo al DOM para no re-renderizar la pila de
   * hojas en cada frame; React sólo toma el control al asentar la página.
   */
  const dragTo = useCallback((offset: number, fromPage: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = `translate3d(0, calc(${-fromPage * 100}% + ${offset}px), 0)`;
  }, []);

  const settle = useCallback((next: number) => {
    // El drag muta el transform en el DOM; si next === pageIndex React
    // puede no reescribir el style y la hoja queda un poco arriba del hub.
    const el = trackRef.current;
    if (el) {
      el.style.transition = "transform 460ms cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = `translate3d(0, ${-next * 100}%, 0)`;
    }
    setPageIndex(next);
    setAnimating(true);
    window.setTimeout(() => setAnimating(false), 460);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? null;
    touchStartX.current = e.touches[0]?.clientX ?? null;
    lastMove.current = null;
    prevMove.current = null;
    setAnimating(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const startY = touchStartY.current;
    const startX = touchStartX.current;
    const y = e.touches[0]?.clientY;
    const x = e.touches[0]?.clientX;
    if (startY == null || startX == null || y == null || x == null) return;
    const dy = y - startY;
    const dx = x - startX;
    if (Math.abs(dx) > Math.abs(dy) * 1.1) return;

    prevMove.current = lastMove.current;
    lastMove.current = { y, t: performance.now() };

    const height = viewportRef.current?.clientHeight ?? 700;
    const atStart = pageIndex === 0 && dy > 0;
    const atEnd = pageIndex >= pageCount - 1 && dy < 0;
    // En los extremos el recorrido se frena (rubber band)
    const offset = atStart || atEnd ? dy * 0.25 : dy;
    dragTo(Math.max(-height, Math.min(height, offset)), pageIndex);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const startY = touchStartY.current;
    touchStartY.current = null;
    touchStartX.current = null;
    const endY = e.changedTouches[0]?.clientY;

    let velocity = 0;
    if (lastMove.current && prevMove.current) {
      const dt = lastMove.current.t - prevMove.current.t;
      if (dt > 0) velocity = (prevMove.current.y - lastMove.current.y) / dt; // + = hacia arriba
    }
    lastMove.current = null;
    prevMove.current = null;

    if (startY == null || endY == null) {
      settle(pageIndex);
      return;
    }

    const dy = startY - endY; // + = swipe up = página siguiente
    // Un flick corto pero rápido también cambia de hoja
    const fastUp = velocity > 0.5 && dy > 12;
    const fastDown = velocity < -0.5 && dy < -12;

    if ((dy > SWIPE_THRESHOLD_PX || fastUp) && pageIndex < pageCount - 1) {
      settle(pageIndex + 1);
    } else if ((dy < -SWIPE_THRESHOLD_PX || fastDown) && pageIndex > 0) {
      settle(pageIndex - 1);
    } else {
      settle(pageIndex);
    }
  };

  /* —— Portada: 50% identidad / 50% 4 sellos —— */
  const renderCover = () => (
    <section className="relative h-full w-full flex flex-col bg-[#faf6ef] px-4 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-12 overflow-hidden">
      <PageBackdrop />
      <div className="relative z-10 h-1/2 min-h-0 flex flex-col border-b border-[#d9cdb3]/80 pb-2">
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div>
            <p className="text-[9px] font-passport-mrz tracking-[0.35em] text-stone-500 uppercase">
              Clúster Turístico de Puebla
            </p>
            <h1 className="text-lg font-black font-serif-cluster uppercase tracking-[0.12em] text-[#3d2914] leading-tight mt-0.5">
              Pasaporte Digital
            </h1>
          </div>
          <p className="passport-value text-[10px] leading-snug text-right shrink-0 max-w-[7rem]">
            Puebla de Los Ángeles
          </p>
        </div>

        <div className="mt-3 flex gap-3 min-h-0 flex-1">
          <div className="shrink-0 w-[5.25rem] h-[6.6rem] border-2 border-[#b8a88a] bg-[#ede6d8] overflow-hidden shadow-inner self-start">
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

          <div className="flex-1 min-w-0 grid grid-cols-[minmax(0,1fr)_5rem] gap-x-2.5 gap-y-1.5 content-start pt-0.5">
            <div className="space-y-1.5">
              <div>
                <p className="passport-label">Nombre</p>
                <p className="passport-value text-[13px] leading-snug mt-0.5 break-words">
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
            <div className="space-y-1.5 pl-2 border-l border-[#d9cdb3]/70">
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

        <div className="shrink-0 mt-auto pt-1">
          <PassportProgressTrack animatedProgress={progress} tierId={tierId} />
        </div>
      </div>

      <div className="relative z-10 h-1/2 min-h-0 flex flex-col pt-2">
        <p className="text-[9px] text-center text-stone-400/80 font-light tracking-wide mb-1.5 shrink-0">
          Desliza hacia arriba para pasar la hoja
        </p>
        <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-2 place-items-center overflow-hidden">
          {coverStamps.map((restaurant) => {
            const stamp = stampMap[restaurant.id];
            return (
              <StampCell
                key={restaurant.id}
                restaurant={restaurant}
                hasStamp={Boolean(stamp?.count)}
                count={stamp?.count}
                isFlashing={stampFlashId === restaurant.id}
              />
            );
          })}
        </div>
        {pageCount === 1 ? (
          <p className="shrink-0 text-center pt-2 pb-1">
            {alreadyOnPassportRoster ? (
              <span
                className="text-[10px] text-stone-500 cursor-default select-none"
                title="Tu plan de negocio ya incluye presencia en el Pasaporte Digital"
              >
                Ya formas parte del Pasaporte Digital con tu plan de negocio.
              </span>
            ) : (
              <PlanIntentCta
                plan="NEGOCIO_FAMILIAR"
                className="text-[10px] text-stone-500 hover:text-[#27366D] transition underline decoration-dotted underline-offset-2 decoration-stone-400"
                alreadyActiveMessage="Ya formas parte del Pasaporte Digital con tu plan de negocio."
              >
                ¿Quieres estar en el Pasaporte Digital? Regístrate aquí.
              </PlanIntentCta>
            )}
          </p>
        ) : null}
      </div>
    </section>
  );

  /* —— Páginas de sellos —— */
  const renderStampPage = (pageNum: number) => {
    const page = restPages[pageNum - 1] ?? [];
    const isLastPage = pageNum === pageCount - 1;
    return (
      <section
        className={`relative h-full w-full flex flex-col bg-[#faf6ef] px-4 pt-[max(0.5rem,env(safe-area-inset-top,0px))] overflow-hidden ${
          isLastPage ? "pb-3" : "pb-12"
        }`}
      >
        <PageBackdrop />
        <div className="relative z-10 shrink-0 flex items-center justify-between border-b border-[#d9cdb3]/70 pb-2 mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Sellos</p>
          <p className="text-[10px] font-passport-mrz text-stone-400 tabular-nums">
            {pageNum + 1} / {pageCount}
          </p>
        </div>
        <div className="relative z-10 flex-1 min-h-0 grid grid-cols-2 grid-rows-4 gap-2 place-items-center overflow-hidden">
          {page.map((restaurant) => {
            const stamp = stampMap[restaurant.id];
            return (
              <StampCell
                key={restaurant.id}
                restaurant={restaurant}
                hasStamp={Boolean(stamp?.count)}
                count={stamp?.count}
                isFlashing={stampFlashId === restaurant.id}
                size="sm"
              />
            );
          })}
        </div>
        {isLastPage ? (
          <p className="relative z-10 shrink-0 text-center mt-3 pt-2.5 border-t border-[#d9cdb3]/55 pb-1">
            {alreadyOnPassportRoster ? (
              <span
                className="text-[10px] text-stone-500 cursor-default select-none"
                title="Tu plan de negocio ya incluye presencia en el Pasaporte Digital"
              >
                Ya formas parte del Pasaporte Digital con tu plan de negocio.
              </span>
            ) : (
              <PlanIntentCta
                plan="NEGOCIO_FAMILIAR"
                className="text-[10px] text-stone-500 hover:text-[#27366D] transition underline decoration-dotted underline-offset-2 decoration-stone-400"
              >
                ¿Quieres estar en el Pasaporte Digital? Regístrate aquí.
              </PlanIntentCta>
            )}
          </p>
        ) : null}
      </section>
    );
  };

  return (
    <div className="relative flex-1 min-h-0 w-full bg-[#faf6ef] text-slate-900 overflow-hidden overscroll-none select-none">
      <div
        ref={viewportRef}
        className="relative z-10 h-full w-full overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={trackRef}
          className="relative h-full w-full will-change-transform"
          style={{
            transform: `translate3d(0, ${-pageIndex * 100}%, 0)`,
            transition: animating ? "transform 460ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          }}
        >
          {Array.from({ length: pageCount }).map((_, i) => (
            <div
              key={i}
              className="absolute inset-x-0 h-full"
              style={{
                top: `${i * 100}%`,
                // Sombra en el canto superior: se lee como hoja sobre hoja al deslizar
                boxShadow: i > 0 ? "0 -10px 22px rgba(45,35,20,0.07)" : "none",
              }}
              aria-hidden={i !== pageIndex}
            >
              {i === 0 ? renderCover() : renderStampPage(i)}
            </div>
          ))}
        </div>
      </div>

      {pageCount > 1 && (
        <div
          className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-none"
          aria-hidden
        >
          {Array.from({ length: pageCount }).map((_, i) => (
            <span
              key={i}
              className={`w-1.5 rounded-full transition-all duration-300 ${
                i === pageIndex ? "h-4 bg-[#27366D]" : "h-1.5 bg-stone-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
