"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Camera } from "lucide-react";
import { scanQrFromImageFile } from "@/lib/qr-scan-client";
import { getMapHrefForRestaurant } from "@/lib/pasaporte";
import PasaporteInfoCard from "../components/PasaporteInfoCard";

type RestaurantCard = {
  id: number;
  name: string;
  slug: string;
  foto: string;
  categoria: string;
};

interface PasaporteClientProps {
  userName: string;
  userImage: string | null;
  isAuthenticated: boolean;
  restaurants: RestaurantCard[];
  stampMap: Record<number, { count: number; lastStampAt: string }>;
  totalStamps: number;
  uniqueStamped: number;
  totalRestaurants: number;
  tierLabel: string;
  tierId: "turista" | "poblano";
  isPoblanoComplete: boolean;
  progress: number;
}

const STAMP_OUTLINE_COLORS = [
  "border-emerald-700",
  "border-red-600",
  "border-[#27366D]",
] as const;

const MRZ_SLOTS = 28;
const STATS_ANIMATION_MS = 1600;

const PREVIEW_NAME = "Ana García";
const PREVIEW_TEMPORADA = "Chiles en Nogada";
const PREVIEW_RANGO = "Turista";
const PREVIEW_MAX_PROGRESS = 80;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function typeInRange(progress: number, start: number, end: number, text: string): string {
  const t = clamp01((progress - start) / (end - start));
  return text.slice(0, Math.ceil(t * text.length));
}

/** 0 → section entering from below; 1 → section in the upper focus band of the viewport */
function getSectionRevealProgress(
  element: HTMLElement,
  container: HTMLElement,
  enterAt = 0.86,
  completeAt = 0.4
): number {
  const rect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  if (containerRect.height <= 0) return 0;

  const relativeTop = (rect.top - containerRect.top) / containerRect.height;
  return clamp01((enterAt - relativeTop) / (enterAt - completeAt));
}

function collectVisiblePreviewStamps(
  stampsEl: HTMLElement,
  container: HTMLElement,
  allowedIds: number[]
): Set<number> {
  const allowed = new Set(allowedIds);
  const visible = new Set<number>();
  stampsEl.querySelectorAll<HTMLElement>("[data-preview-stamp]").forEach((cell) => {
    const id = Number(cell.dataset.previewStamp);
    if (!Number.isFinite(id) || !allowed.has(id)) return;
    const progress = getSectionRevealProgress(cell, container, 0.94, 0.62);
    if (progress >= 0.88) visible.add(id);
  });
  return visible;
}

function pickPreviewStampIds(restaurants: RestaurantCard[]): number[] {
  return [...restaurants]
    .sort((a, b) => ((a.id * 37 + 11) % 101) - ((b.id * 37 + 11) % 101))
    .slice(0, Math.min(5, restaurants.length))
    .map((r) => r.id);
}

type PreviewScrollState = {
  displayName: string;
  displayTemporada: string;
  displayRango: string;
  displayProgress: number;
  displayStamps: number;
  displayVisited: number;
  visibleStampIds: Set<number>;
  isTypingName: boolean;
  isTypingTemporada: boolean;
  isTypingRango: boolean;
};

const EMPTY_PREVIEW: PreviewScrollState = {
  displayName: "",
  displayTemporada: "",
  displayRango: "",
  displayProgress: 0,
  displayStamps: 0,
  displayVisited: 0,
  visibleStampIds: new Set(),
  isTypingName: false,
  isTypingTemporada: false,
  isTypingRango: false,
};

function useScrollPreviewDemo(
  enabled: boolean,
  restaurants: RestaurantCard[],
  totalRestaurants: number,
  fieldsRef: React.RefObject<HTMLElement | null>,
  progressRef: React.RefObject<HTMLElement | null>,
  stampsRef: React.RefObject<HTMLElement | null>,
  scrollContainerRef: React.RefObject<HTMLElement | null>
): PreviewScrollState {
  const previewStampIds = useMemo(() => pickPreviewStampIds(restaurants), [restaurants]);
  const [state, setState] = useState<PreviewScrollState>(EMPTY_PREVIEW);

  useEffect(() => {
    if (!enabled) return;

    const applyFullPreview = () => {
      setState({
        displayName: PREVIEW_NAME,
        displayTemporada: PREVIEW_TEMPORADA,
        displayRango: PREVIEW_RANGO,
        displayProgress: PREVIEW_MAX_PROGRESS,
        displayStamps: previewStampIds.length,
        displayVisited: Math.min(previewStampIds.length, totalRestaurants),
        visibleStampIds: new Set(previewStampIds),
        isTypingName: false,
        isTypingTemporada: false,
        isTypingRango: false,
      });
    };

    const update = () => {
      const container = scrollContainerRef.current;
      const fieldsEl = fieldsRef.current;
      const progressEl = progressRef.current;
      const stampsEl = stampsRef.current;
      if (!container || !fieldsEl || !progressEl || !stampsEl) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const rect = fieldsEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.top < containerRect.bottom && rect.bottom > containerRect.top) applyFullPreview();
        return;
      }

      const fieldsP = getSectionRevealProgress(fieldsEl, container, 0.9, 0.48);
      const name = typeInRange(fieldsP, 0, 0.34, PREVIEW_NAME);
      const temporada = typeInRange(fieldsP, 0.3, 0.64, PREVIEW_TEMPORADA);
      const rango = typeInRange(fieldsP, 0.58, 1, PREVIEW_RANGO);

      const barP = getSectionRevealProgress(progressEl, container, 0.88, 0.42);
      const displayProgress = Math.round(barP * PREVIEW_MAX_PROGRESS);
      const barPhaseStamps = Math.round(barP * previewStampIds.length);

      const visibleStampIds = collectVisiblePreviewStamps(stampsEl, container, previewStampIds);
      const displayStamps = visibleStampIds.size > 0 ? visibleStampIds.size : barPhaseStamps;
      const displayVisited = visibleStampIds.size > 0 ? visibleStampIds.size : barPhaseStamps;

      setState({
        displayName: name,
        displayTemporada: temporada,
        displayRango: rango,
        displayProgress,
        displayStamps,
        displayVisited: Math.min(displayVisited, totalRestaurants),
        visibleStampIds,
        isTypingName: name.length < PREVIEW_NAME.length && fieldsP > 0 && fieldsP < 0.34,
        isTypingTemporada:
          temporada.length < PREVIEW_TEMPORADA.length && fieldsP > 0.3 && fieldsP < 0.64,
        isTypingRango: rango.length < PREVIEW_RANGO.length && fieldsP > 0.58 && fieldsP < 1,
      });
    };

    update();
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      container.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [enabled, previewStampIds, fieldsRef, progressRef, stampsRef, scrollContainerRef, totalRestaurants]);

  return state;
}

function TypewriterValue({ text, isTyping }: { text: string; isTyping: boolean }) {
  return (
    <span>
      {text}
      {isTyping && (
        <span className="inline-block w-[0.45em] text-[#27366D] animate-pulse" aria-hidden>
          |
        </span>
      )}
    </span>
  );
}

type AnimatedPassportStats = {
  stamps: number;
  visited: number;
  progress: number;
};

function useAnimatedPassportStats(
  totalStamps: number,
  uniqueStamped: number,
  progress: number,
  enabled: boolean
): AnimatedPassportStats {
  const [animated, setAnimated] = useState<AnimatedPassportStats>({
    stamps: 0,
    visited: 0,
    progress: 0,
  });

  useEffect(() => {
    if (!enabled) {
      setAnimated({ stamps: 0, visited: 0, progress: 0 });
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimated({ stamps: totalStamps, visited: uniqueStamped, progress });
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / STATS_ANIMATION_MS);
      const eased = 1 - (1 - t) ** 3;
      setAnimated({
        stamps: Math.round(totalStamps * eased),
        visited: Math.round(uniqueStamped * eased),
        progress: Math.round(progress * eased),
      });
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [totalStamps, uniqueStamped, progress, enabled]);

  return animated;
}

function PassportProgressTrack({
  animatedProgress,
  tierId,
}: {
  animatedProgress: number;
  tierId: "turista" | "poblano";
}) {
  const filledSlots = Math.round((animatedProgress / 100) * MRZ_SLOTS);

  return (
    <div className="mt-5">
      <div className="flex items-end justify-between gap-3 font-passport-mrz text-[11px] sm:text-xs font-bold tracking-[0.14em]">
        <span className={tierId === "turista" ? "text-[#27366D]" : "text-stone-500"}>TURISTA</span>
        <span className={tierId === "poblano" ? "text-amber-700" : "text-stone-500"}>POBLANO</span>
      </div>
      <div
        className="mt-2 flex w-full justify-between font-passport-mrz text-[13px] sm:text-sm leading-none select-none"
        aria-hidden
      >
        {Array.from({ length: MRZ_SLOTS }).map((_, index) => (
          <span
            key={index}
            className={
              index < filledSlots
                ? tierId === "poblano"
                  ? "text-amber-700"
                  : "text-[#27366D]"
                : "text-stone-300/90"
            }
          >
            {"<"}
          </span>
        ))}
      </div>
      <div className="mt-2 h-1 w-full rounded-full bg-stone-300/70 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            tierId === "poblano"
              ? "bg-gradient-to-r from-amber-500 to-amber-700"
              : "bg-gradient-to-r from-[#27366D] to-[#1e2b58]"
          }`}
          style={{ width: `${animatedProgress}%` }}
        />
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function PasaporteInner({
  userName,
  userImage,
  isAuthenticated,
  restaurants,
  stampMap,
  totalStamps,
  uniqueStamped,
  totalRestaurants,
  tierLabel,
  tierId,
  isPoblanoComplete,
  progress,
}: PasaporteClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previewFieldsRef = useRef<HTMLDivElement>(null);
  const previewProgressRef = useRef<HTMLDivElement>(null);
  const previewStampsRef = useRef<HTMLDivElement>(null);
  const [showPoblanoCelebration, setShowPoblanoCelebration] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const isPreview = !isAuthenticated;
  const previewStampIds = useMemo(
    () => (isPreview ? pickPreviewStampIds(restaurants) : []),
    [isPreview, restaurants]
  );
  const previewScroll = useScrollPreviewDemo(
    isPreview,
    restaurants,
    totalRestaurants,
    previewFieldsRef,
    previewProgressRef,
    previewStampsRef,
    scrollContainerRef
  );
  const animatedStats = useAnimatedPassportStats(
    totalStamps,
    uniqueStamped,
    progress,
    isAuthenticated
  );

  const displayName = isPreview ? previewScroll.displayName : userName;
  const displayTemporada = isPreview ? previewScroll.displayTemporada : "Chiles en Nogada";
  const displayRango = isPreview ? previewScroll.displayRango : tierLabel.toUpperCase();
  const displayTierId = isPreview ? "turista" : tierId;
  const displayStats = isPreview
    ? {
        stamps: previewScroll.displayStamps,
        visited: previewScroll.displayVisited,
        progress: previewScroll.displayProgress,
      }
    : animatedStats;

  const openNativeCamera = useCallback(() => {
    setQrError(null);
    cameraInputRef.current?.click();
  }, []);

  const handleQrCapture = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      setQrError(null);

      try {
        const path = await scanQrFromImageFile(file);
        if (path) {
          router.push(path);
          return;
        }
        setQrError("No encontramos un QR válido de Barriando. Intenta de nuevo.");
      } catch (error) {
        if (error instanceof Error && error.message === "BARCODE_DETECTOR_UNAVAILABLE") {
          setQrError("Tu navegador no puede leer QR desde la foto. Prueba con Chrome o Safari.");
          return;
        }
        setQrError("No pudimos procesar la imagen. Toma otra foto más cerca del QR.");
      }
    },
    [router]
  );

  useEffect(() => {
    if (isPoblanoComplete) {
      setShowPoblanoCelebration(true);
      const t = setTimeout(() => setShowPoblanoCelebration(false), 4000);
      return () => clearTimeout(t);
    }
  }, [isPoblanoComplete]);

  const notice = useMemo(() => {
    const sello = searchParams.get("sello");
    const error = searchParams.get("error");
    const info = searchParams.get("info");
    const nombre = searchParams.get("nombre");

    if (sello === "ok" && nombre) {
      return { type: "success" as const, text: `¡Sello registrado en ${decodeURIComponent(nombre)}!` };
    }
    if (info === "cooldown") {
      const horas = searchParams.get("horas") ?? "18";
      return {
        type: "info" as const,
        text: `Ya sellaste este restaurante recientemente. Vuelve en ~${horas} h para un nuevo sello.`,
      };
    }
    if (error === "invalid_restaurant") {
      return { type: "error" as const, text: "Restaurante no participante o enlace inválido." };
    }
    if (error === "restaurante_requerido") {
      return { type: "error" as const, text: "Falta el identificador del restaurante en el enlace QR." };
    }
    return null;
  }, [searchParams]);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#e8e0d0]"
    >
      <div className={`py-3 sm:py-6 px-2 sm:px-4 ${isAuthenticated ? "pb-24" : "pb-6"}`}>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden
        onChange={handleQrCapture}
      />

      <div className="max-w-lg sm:max-w-2xl mx-auto">
        {!isAuthenticated && <PasaporteInfoCard className="mb-5 sm:mb-6" />}

        {isPreview && (
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif-cluster text-[#3d2914] text-center mb-5 sm:mb-6 tracking-wide leading-tight">
            Llénalo todo.
          </h2>
        )}

        <div className="relative rounded-xl sm:rounded-2xl border border-[#c9b896] bg-[#faf6ef] shadow-[0_12px_40px_rgba(80,55,20,0.14)] overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.28] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(160,120,60,0.07) 24px, rgba(160,120,60,0.07) 25px)",
            }}
          />

          {/* Hoja de identificación */}
          <div className="relative px-4 sm:px-8 pt-5 sm:pt-7 pb-6 border-b border-[#d9cdb3]">
            <div className="flex items-start justify-between gap-3 border-b border-[#d9cdb3]/80 pb-3">
              <div>
                <p className="text-[9px] font-passport-mrz tracking-[0.35em] text-stone-500 uppercase">
                  Clúster Turístico de Puebla
                </p>
                <h1 className="text-lg sm:text-2xl font-black font-serif-cluster uppercase tracking-[0.12em] text-[#3d2914] leading-tight mt-0.5">
                  Pasaporte Digital
                </h1>
              </div>
              <p className="passport-value text-[11px] sm:text-xs leading-snug text-right shrink-0 max-w-[8.5rem] sm:max-w-[9.5rem]">
                Puebla de Los Ángeles
              </p>
            </div>

            <div className="mt-4 flex gap-4 sm:gap-5">
              <div className="shrink-0 w-[5.5rem] h-[7rem] sm:w-24 sm:h-[7.5rem] border-2 border-[#b8a88a] bg-[#ede6d8] overflow-hidden shadow-inner">
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
                      {getInitials(displayName) || "?"}
                    </span>
                    <span className="text-[8px] font-passport-mrz tracking-widest mt-1 uppercase">Foto</span>
                  </div>
                )}
              </div>

              <div
                ref={previewFieldsRef}
                className="flex-1 min-w-0 grid grid-cols-[minmax(0,1fr)_6.75rem] sm:grid-cols-[minmax(0,1fr)_7.5rem] gap-x-5 gap-y-2.5 pt-0.5 items-start"
              >
                <div className="space-y-2.5">
                  <div>
                    <p className="passport-label">Nombre</p>
                    <p className="passport-value text-sm sm:text-base leading-snug mt-0.5 break-words min-h-[1.35em]">
                      <TypewriterValue text={displayName} isTyping={isPreview && previewScroll.isTypingName} />
                    </p>
                  </div>
                  <div>
                    <p className="passport-label">Temporada</p>
                    <p className="passport-value text-[11px] sm:text-xs mt-0.5 min-h-[1.1em]">
                      <TypewriterValue
                        text={displayTemporada}
                        isTyping={isPreview && previewScroll.isTypingTemporada}
                      />
                    </p>
                  </div>
                  <div>
                    <p className="passport-label">Rango</p>
                    <p
                      className={`passport-value text-[11px] sm:text-xs mt-0.5 flex items-center gap-1.5 min-h-[1.1em] ${
                        displayTierId === "poblano" ? "text-amber-900" : ""
                      }`}
                    >
                      {displayTierId === "poblano" && <span aria-hidden>★</span>}
                      <TypewriterValue
                        text={displayRango}
                        isTyping={isPreview && previewScroll.isTypingRango}
                      />
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-0.5 pl-3 border-l border-[#d9cdb3]/70">
                  <div>
                    <p className="passport-label">Sellos</p>
                    <p className="passport-value text-[11px] sm:text-xs mt-0.5">{displayStats.stamps}</p>
                  </div>
                  <div>
                    <p className="passport-label">Visitados</p>
                    <p className="passport-value text-[11px] sm:text-xs mt-0.5">
                      {displayStats.visited}/{totalRestaurants}
                    </p>
                  </div>
                  <div>
                    <p className="passport-label">Progreso</p>
                    <p className="passport-value text-[11px] sm:text-xs mt-0.5">{displayStats.progress}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div ref={previewProgressRef}>
              <PassportProgressTrack animatedProgress={displayStats.progress} tierId={displayTierId} />
            </div>

            {notice && (
              <div
                className={`mt-3 text-[11px] rounded-lg px-3 py-2.5 border ${
                  notice.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : notice.type === "error"
                      ? "bg-red-50 border-red-200 text-red-800"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                {notice.text}
              </div>
            )}
          </div>

          <div className="relative px-4 sm:px-8 py-5 sm:py-7 border-t border-[#d9cdb3]/70">
            {showPoblanoCelebration && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-amber-100/92 backdrop-blur-sm">
                <div className="text-center px-4 py-3">
                  <span className="text-3xl block mb-1">👑</span>
                  <p className="text-base font-black font-serif-cluster text-amber-800 uppercase tracking-wide">
                    ¡Eres un verdadero Poblano!
                  </p>
                </div>
              </div>
            )}
            <div
              ref={previewStampsRef}
              className={`grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5 ${isPreview ? "pb-[38vh]" : ""}`}
            >
              {restaurants.map((restaurant, index) => {
                const stamp = stampMap[restaurant.id];
                const hasStamp = isPreview
                  ? previewScroll.visibleStampIds.has(restaurant.id)
                  : Boolean(stamp?.count);
                const colorClass = STAMP_OUTLINE_COLORS[index % STAMP_OUTLINE_COLORS.length];

                return (
                  <Link
                    key={restaurant.id}
                    href={getMapHrefForRestaurant(restaurant.id)}
                    data-preview-stamp={
                      isPreview && previewStampIds.includes(restaurant.id)
                        ? restaurant.id
                        : undefined
                    }
                    className={`flex flex-col items-center text-center gap-2 transition-opacity duration-500 active:scale-[0.98] ${
                      !hasStamp ? "opacity-40" : "opacity-100"
                    }`}
                  >
                    <div className="relative">
                      <div
                        className={`w-[4.25rem] h-[4.25rem] sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center bg-transparent p-2.5 transition-all duration-700 ${
                          hasStamp
                            ? `${colorClass} border-solid rotate-[-8deg] scale-100`
                            : "border-dashed border-stone-300 scale-95"
                        }`}
                      >
                        {hasStamp && (
                          <Image
                            src={`/logos/${restaurant.foto}.png`}
                            alt={restaurant.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-contain"
                            unoptimized
                          />
                        )}
                      </div>
                      {stamp && stamp.count > 1 && (
                        <span className="absolute -top-1 -right-1 min-w-[1.15rem] h-4 px-1 rounded-full bg-[#27366D] text-white text-[9px] font-bold flex items-center justify-center shadow">
                          x{stamp.count}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-stone-700 leading-tight line-clamp-2">
                      {restaurant.name}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-stone-600 mt-4 max-w-sm mx-auto leading-relaxed font-light px-2">
          <Link href="/map" className="font-semibold text-[#27366D] underline underline-offset-2">
            Entra al MAP
          </Link>{" "}
          y descubre qué lugares del barrio te dan sellos.
        </p>
      </div>
      </div>

      {isAuthenticated && (
        <button
          type="button"
          onClick={openNativeCamera}
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-50 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_8px_24px_rgba(0,0,0,0.22)] flex items-center justify-center transition active:scale-95 animate-soft-glow"
          aria-label="Escanear QR con la cámara"
        >
          <Camera className="w-6 h-6" strokeWidth={2.25} />
        </button>
      )}

      {isAuthenticated && qrError && (
        <p className="fixed bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+4.25rem)] right-4 left-4 z-50 max-w-xs ml-auto text-[11px] text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2 shadow-md">
          {qrError}
        </p>
      )}
    </div>
  );
}

export default function PasaporteClient(props: PasaporteClientProps) {
  return (
    <Suspense fallback={null}>
      <PasaporteInner {...props} />
    </Suspense>
  );
}
