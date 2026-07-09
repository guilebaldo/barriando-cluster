"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Camera } from "lucide-react";
import { scanQrFromImageFile } from "@/lib/qr-scan-client";
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

function getPreviewScrollProgress(element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const start = viewportHeight * 0.92;
  const traveled = start - rect.top;
  const scrollable = rect.height + viewportHeight * 0.35;
  return clamp01(traveled / scrollable);
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
  scrollRootRef: React.RefObject<HTMLElement | null>
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
      const el = scrollRootRef.current;
      if (!el) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) applyFullPreview();
        return;
      }

      const p = getPreviewScrollProgress(el);
      const name = typeInRange(p, 0.05, 0.22, PREVIEW_NAME);
      const temporada = typeInRange(p, 0.22, 0.38, PREVIEW_TEMPORADA);
      const rango = typeInRange(p, 0.38, 0.52, PREVIEW_RANGO);
      const barT = clamp01((p - 0.52) / 0.18);
      const displayProgress = Math.round(barT * PREVIEW_MAX_PROGRESS);

      const stampRevealT = clamp01((p - 0.7) / 0.28);
      const visibleCount = Math.min(
        previewStampIds.length,
        Math.ceil(stampRevealT * previewStampIds.length)
      );
      const visibleStampIds = new Set(previewStampIds.slice(0, visibleCount));
      const inBarPhase = p >= 0.52 && p < 0.7;
      const barPhaseStamps = Math.round(barT * previewStampIds.length);
      const displayStamps = visibleCount > 0 ? visibleCount : inBarPhase ? barPhaseStamps : 0;
      const displayVisited =
        visibleCount > 0 ? visibleCount : inBarPhase ? barPhaseStamps : 0;

      setState({
        displayName: name,
        displayTemporada: temporada,
        displayRango: rango,
        displayProgress,
        displayStamps,
        displayVisited: Math.min(displayVisited, totalRestaurants),
        visibleStampIds,
        isTypingName: name.length < PREVIEW_NAME.length && p >= 0.05 && p < 0.22,
        isTypingTemporada:
          temporada.length < PREVIEW_TEMPORADA.length && p >= 0.22 && p < 0.38,
        isTypingRango: rango.length < PREVIEW_RANGO.length && p >= 0.38 && p < 0.52,
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [enabled, previewStampIds, scrollRootRef, totalRestaurants]);

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
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const [showPoblanoCelebration, setShowPoblanoCelebration] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const isPreview = !isAuthenticated;
  const previewScroll = useScrollPreviewDemo(isPreview, restaurants, totalRestaurants, previewScrollRef);
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
    <div className={`min-h-[calc(100dvh-4rem)] bg-[#e8e0d0] py-3 sm:py-8 px-2 sm:px-4 ${isAuthenticated ? "pb-24" : "pb-8"}`}>
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

        <div ref={previewScrollRef} className={isPreview ? "min-h-[145vh]" : undefined}>
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

              <div className="flex-1 min-w-0 grid grid-cols-[minmax(0,1fr)_6.75rem] sm:grid-cols-[minmax(0,1fr)_7.5rem] gap-x-5 gap-y-2.5 pt-0.5 items-start">
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

            <PassportProgressTrack animatedProgress={displayStats.progress} tierId={displayTierId} />

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

          {/* Cuadrícula de sellos */}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
              {restaurants.map((restaurant, index) => {
                const stamp = stampMap[restaurant.id];
                const hasStamp = isPreview
                  ? previewScroll.visibleStampIds.has(restaurant.id)
                  : Boolean(stamp?.count);
                const colorClass = STAMP_OUTLINE_COLORS[index % STAMP_OUTLINE_COLORS.length];

                return (
                  <div
                    key={restaurant.id}
                    className={`flex flex-col items-center text-center gap-2 transition-opacity duration-500 ${
                      !hasStamp ? "opacity-40" : "opacity-100"
                    }`}
                  >
                    <div className="relative">
                      <div
                        className={`w-[4.25rem] h-[4.25rem] sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center bg-transparent p-2.5 transition-all duration-500 ${
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
                  </div>
                );
              })}
            </div>
          </div>
        </div>

          {isPreview && <div className="h-[38vh]" aria-hidden />}
        </div>

        <p className="text-center text-[10px] text-stone-600 mt-4 max-w-sm mx-auto leading-relaxed font-light px-2">
          Escanea el QR en cada restaurante participante. Un sello por visita cada 18 horas por lugar.
        </p>
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
