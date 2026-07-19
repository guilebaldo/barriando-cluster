"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Camera, X } from "lucide-react";
import { getMapHrefForRestaurant } from "@/lib/pasaporte";
import SecurityPatternBackground from "@/components/ui/SecurityPatternBackground";
import PasaporteInfoCard from "../components/PasaporteInfoCard";
import QrScanModal from "../components/QrScanModal";
import AddToHomeScreenModal from "../barrid/AddToHomeScreenModal";

type RestaurantCard = {
  id: number;
  name: string;
  slug: string;
  foto: string;
  categoria: string;
  logoUrl?: string | null;
};

interface PasaporteClientProps {
  userName: string;
  userImage: string | null;
  userId?: string | null;
  isAuthenticated: boolean;
  /** Ya tiene plan de negocio ($600+) — puede ofrecer sello; no mostrar CTA de alta. */
  alreadyOnPassportRoster?: boolean;
  /** Account created within the first-login window (A2HS suggestion). */
  isFirstLoginUser?: boolean;
  usePageScroll?: boolean;
  restaurants: RestaurantCard[];
  /** Sellos destacados en demo logout: Mediana + Gran Empresa (roster). */
  featuredPreviewStampIds?: number[];
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

const MRZ_SLOTS = 20; // 10 a cada lado del porcentaje
const STATS_ANIMATION_MS = 1600;

const PREVIEW_NAME = "Ana García";
const PREVIEW_TEMPORADA = "Chiles en Nogada";
const PREVIEW_RANGO = "Turista";
const PREVIEW_MAX_PROGRESS = 80;
const PREVIEW_MS_PER_CHAR = 110;
const PREVIEW_FIELD_GAP_MS = 650;
const PREVIEW_STATS_DURATION_MS = 5200;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function typeByElapsed(elapsedMs: number, startMs: number, text: string): string {
  if (elapsedMs < startMs) return "";
  const chars = Math.floor((elapsedMs - startMs) / PREVIEW_MS_PER_CHAR);
  return text.slice(0, Math.min(text.length, chars));
}

function easeOutSoft(t: number): number {
  return 1 - (1 - clamp01(t)) ** 2.4;
}
function getSectionRevealProgress(
  element: HTMLElement,
  container: HTMLElement | null,
  enterAt = 0.86,
  completeAt = 0.4
): number {
  const rect = element.getBoundingClientRect();
  const containerRect = container
    ? container.getBoundingClientRect()
    : { top: 0, height: window.innerHeight };
  if (containerRect.height <= 0) return 0;

  const relativeTop = (rect.top - containerRect.top) / containerRect.height;
  return clamp01((enterAt - relativeTop) / (enterAt - completeAt));
}

/**
 * Revela sellos destacados uno por uno al scrollear (orden DOM).
 * Una vez visibles, se quedan (sticky).
 */
function collectVisiblePreviewStamps(
  stampsEl: HTMLElement,
  container: HTMLElement | null,
  allowedIds: number[],
  alreadyVisible: Set<number>
): Set<number> {
  const allowed = new Set(allowedIds);
  const cells = Array.from(
    stampsEl.querySelectorAll<HTMLElement>("[data-preview-stamp]")
  )
    .map((cell) => {
      const id = Number(cell.dataset.previewStamp);
      if (!Number.isFinite(id) || !allowed.has(id)) return null;
      return { id, cell };
    })
    .filter((item): item is { id: number; cell: HTMLElement } => item != null);

  const visible = new Set(alreadyVisible);

  for (let i = 0; i < cells.length; i++) {
    const { id, cell } = cells[i]!;
    if (visible.has(id)) continue;

    const prevId = i > 0 ? cells[i - 1]!.id : null;
    if (prevId != null && !visible.has(prevId)) break;

    // Entra cuando el sello se acerca a la mitad inferior del viewport.
    const progress = getSectionRevealProgress(cell, container, 0.92, 0.48);
    if (progress >= 0.42) {
      visible.add(id);
    } else {
      break;
    }
  }

  return visible;
}

function pickPreviewStampIds(
  restaurants: RestaurantCard[],
  featuredIds: number[] = []
): number[] {
  const restaurantIds = new Set(restaurants.map((r) => r.id));
  const featured = featuredIds.filter((id) => restaurantIds.has(id));
  if (featured.length > 0) return featured;

  // Fallback si no hay Mediana/Gran Empresa AyB en el roster aún.
  return [...restaurants]
    .sort((a, b) => ((a.id * 37 + 11) % 101) - ((b.id * 37 + 11) % 101))
    .slice(0, Math.min(5, restaurants.length))
    .map((r) => r.id);
}

/** Rotación orgánica y estable por id: izq / centro / der. */
function stampTiltClass(id: number): string {
  const tilts = [
    "rotate-[-14deg]",
    "rotate-[-9deg]",
    "rotate-[-5deg]",
    "rotate-0",
    "rotate-[5deg]",
    "rotate-[9deg]",
    "rotate-[14deg]",
  ] as const;
  // Evitar múltiplos de tilts.length (id*7 % 7 === 0 siempre).
  const idx = Math.abs((id * 2654435761) >>> 0) % tilts.length;
  return tilts[idx]!;
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
  featuredPreviewStampIds: number[],
  totalRestaurants: number,
  fieldsRef: React.RefObject<HTMLElement | null>,
  stampsRef: React.RefObject<HTMLElement | null>,
  scrollContainerRef: React.RefObject<HTMLElement | null>
): PreviewScrollState {
  const previewStampIds = useMemo(
    () => pickPreviewStampIds(restaurants, featuredPreviewStampIds),
    [restaurants, featuredPreviewStampIds]
  );
  const [state, setState] = useState<PreviewScrollState>(EMPTY_PREVIEW);
  const sequenceStartedRef = useRef(false);
  const typingFrameRef = useRef(0);
  const visibleStampIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    sequenceStartedRef.current = false;
    visibleStampIdsRef.current = new Set();
    setState(EMPTY_PREVIEW);

    const applyFullPreview = () => {
      visibleStampIdsRef.current = new Set(previewStampIds);
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

    const startTimedSequence = () => {
      if (sequenceStartedRef.current) return;
      sequenceStartedRef.current = true;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        applyFullPreview();
        return;
      }

      const nameDuration = PREVIEW_NAME.length * PREVIEW_MS_PER_CHAR;
      const tempStart = nameDuration + PREVIEW_FIELD_GAP_MS;
      const tempDuration = PREVIEW_TEMPORADA.length * PREVIEW_MS_PER_CHAR;
      const rangoStart = tempStart + tempDuration + PREVIEW_FIELD_GAP_MS;
      const rangoDuration = PREVIEW_RANGO.length * PREVIEW_MS_PER_CHAR;
      const statsStart = rangoStart + rangoDuration + PREVIEW_FIELD_GAP_MS;
      const sequenceEnd = statsStart + PREVIEW_STATS_DURATION_MS;
      const start = performance.now();

      const tick = (now: number) => {
        const elapsed = now - start;
        const name = typeByElapsed(elapsed, 0, PREVIEW_NAME);
        const temporada = typeByElapsed(elapsed, tempStart, PREVIEW_TEMPORADA);
        const rango = typeByElapsed(elapsed, rangoStart, PREVIEW_RANGO);

        let displayProgress = 0;
        let displayStamps = 0;
        let displayVisited = 0;
        if (elapsed >= statsStart) {
          const eased = easeOutSoft((elapsed - statsStart) / PREVIEW_STATS_DURATION_MS);
          displayProgress = Math.round(eased * PREVIEW_MAX_PROGRESS);
          displayStamps = Math.round(eased * previewStampIds.length);
          displayVisited = displayStamps;
        }

        setState({
          displayName: name,
          displayTemporada: temporada,
          displayRango: rango,
          displayProgress,
          displayStamps,
          displayVisited: Math.min(displayVisited, totalRestaurants),
          visibleStampIds: new Set(visibleStampIdsRef.current),
          isTypingName: name.length < PREVIEW_NAME.length && elapsed < tempStart,
          isTypingTemporada:
            temporada.length < PREVIEW_TEMPORADA.length &&
            elapsed >= tempStart &&
            elapsed < rangoStart,
          isTypingRango:
            rango.length < PREVIEW_RANGO.length && elapsed >= rangoStart && elapsed < statsStart,
        });

        if (elapsed < sequenceEnd) {
          typingFrameRef.current = requestAnimationFrame(tick);
        }
      };

      typingFrameRef.current = requestAnimationFrame(tick);
    };

    const updateStamps = () => {
      const container = scrollContainerRef.current;
      const stampsEl = stampsRef.current;
      if (!stampsEl) return;

      visibleStampIdsRef.current = collectVisiblePreviewStamps(
        stampsEl,
        container,
        previewStampIds,
        visibleStampIdsRef.current
      );

      setState((prev) => ({
        ...prev,
        visibleStampIds: new Set(visibleStampIdsRef.current),
        displayStamps:
          visibleStampIdsRef.current.size > 0
            ? visibleStampIdsRef.current.size
            : prev.displayStamps,
        displayVisited:
          visibleStampIdsRef.current.size > 0
            ? Math.min(visibleStampIdsRef.current.size, totalRestaurants)
            : prev.displayVisited,
      }));
    };

    const fieldsEl = fieldsRef.current;
    let observer: IntersectionObserver | null = null;
    if (fieldsEl) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting || entry.intersectionRatio < 0.3) return;
          startTimedSequence();
        },
        {
          threshold: [0, 0.3, 0.55],
          root: scrollContainerRef.current,
          rootMargin: "-8% 0px",
        }
      );
      observer.observe(fieldsEl);
    }

    // Página deslogueada usa scroll de ventana (usePageScroll); logueada usa el contenedor.
    const scrollTarget: HTMLElement | Window = scrollContainerRef.current ?? window;
    updateStamps();
    scrollTarget.addEventListener("scroll", updateStamps, { passive: true });
    window.addEventListener("resize", updateStamps);
    // Por si el layout aún no midió bien en el primer frame.
    const bootFrame = requestAnimationFrame(updateStamps);

    return () => {
      observer?.disconnect();
      scrollTarget.removeEventListener("scroll", updateStamps);
      window.removeEventListener("resize", updateStamps);
      cancelAnimationFrame(bootFrame);
      cancelAnimationFrame(typingFrameRef.current);
    };
  }, [enabled, previewStampIds, fieldsRef, stampsRef, scrollContainerRef, totalRestaurants]);

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
      className="mt-5 flex w-full items-center gap-1 sm:gap-1.5 font-passport-mrz text-[10px] sm:text-xs font-bold tracking-[0.08em] sm:tracking-[0.12em] select-none"
      role="progressbar"
      aria-valuenow={animatedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progreso del pasaporte: ${animatedProgress}%`}
    >
      <span
        className={`shrink-0 ${tierId === "turista" ? "text-[#27366D]" : "text-stone-500"}`}
      >
        TURISTA
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-end gap-px text-[12px] sm:text-sm leading-none" aria-hidden>
        {renderChevrons(0, halfSlots)}
      </span>
      <span
        className={`shrink-0 tabular-nums px-0.5 ${
          tierId === "poblano" ? "text-amber-700" : "text-[#27366D]"
        }`}
      >
        {animatedProgress}%
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-start gap-px text-[12px] sm:text-sm leading-none" aria-hidden>
        {renderChevrons(halfSlots, halfSlots)}
      </span>
      <span
        className={`shrink-0 ${tierId === "poblano" ? "text-amber-700" : "text-stone-500"}`}
      >
        POBLANO
      </span>
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
  userId = null,
  isAuthenticated,
  alreadyOnPassportRoster = false,
  isFirstLoginUser = false,
  usePageScroll = false,
  restaurants,
  featuredPreviewStampIds = [],
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previewFieldsRef = useRef<HTMLDivElement>(null);
  const previewProgressRef = useRef<HTMLDivElement>(null);
  const previewStampsRef = useRef<HTMLDivElement>(null);
  const [showPoblanoCelebration, setShowPoblanoCelebration] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [noticePopup, setNoticePopup] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [stampFlashId, setStampFlashId] = useState<number | null>(null);
  const [addToHomeEligible, setAddToHomeEligible] = useState(false);
  const isPreview = !isAuthenticated;
  const pendingSlug = searchParams.get("pendiente")?.trim() ?? "";
  const pendingStamp = useMemo(() => {
    if (!pendingSlug || isAuthenticated) return null;
    const match = restaurants.find(
      (r) => r.slug.toLowerCase() === pendingSlug.toLowerCase()
    );
    return {
      slug: pendingSlug,
      name: match?.name ?? pendingSlug.replace(/-/g, " "),
    };
  }, [pendingSlug, restaurants, isAuthenticated]);
  const previewStampIds = useMemo(
    () => (isPreview ? pickPreviewStampIds(restaurants, featuredPreviewStampIds) : []),
    [isPreview, restaurants, featuredPreviewStampIds]
  );
  const previewScroll = useScrollPreviewDemo(
    isPreview,
    restaurants,
    featuredPreviewStampIds,
    totalRestaurants,
    previewFieldsRef,
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

  useEffect(() => {
    if (isPoblanoComplete) {
      setShowPoblanoCelebration(true);
      const t = setTimeout(() => setShowPoblanoCelebration(false), 4000);
      return () => clearTimeout(t);
    }
  }, [isPoblanoComplete]);

  useEffect(() => {
    const sello = searchParams.get("sello");
    const error = searchParams.get("error");
    const info = searchParams.get("info");
    const nombre = searchParams.get("nombre");
    const restauranteSlug = searchParams.get("restaurante");
    const queryKey = searchParams.toString();
    if (!queryKey) return;

    let next: { type: "success" | "error" | "info"; text: string } | null = null;

    if (sello === "ok" && nombre) {
      next = {
        type: "success",
        text: `¡Sello registrado en ${decodeURIComponent(nombre)}!`,
      };
    } else if (info === "cooldown") {
      const horas = searchParams.get("horas") ?? "18";
      next = {
        type: "info",
        text: `Ya sellaste este restaurante recientemente. Vuelve en ~${horas} h para un nuevo sello.`,
      };
    } else if (error === "invalid_restaurant") {
      next = { type: "error", text: "Restaurante no participante o enlace inválido." };
    } else if (error === "restaurante_requerido") {
      next = { type: "error", text: "Falta el identificador del restaurante en el enlace QR." };
    }

    if (!next) return;

    setNoticePopup(next);

    if (sello === "ok" && restauranteSlug) {
      const slug = restauranteSlug.trim().toLowerCase();
      const match = restaurants.find((r) => r.slug.toLowerCase() === slug);
      if (match) {
        setStampFlashId(match.id);
        window.setTimeout(() => {
          const el = document.querySelector<HTMLElement>(`[data-stamp-id="${match.id}"]`);
          el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }, 120);
        window.setTimeout(() => setStampFlashId(null), 1800);
      }
    }

    router.replace("/pasaporte", { scroll: false });
  }, [searchParams, restaurants, router]);

  useEffect(() => {
    if (!noticePopup) return;
    const autoClose = window.setTimeout(() => setNoticePopup(null), 5000);
    return () => window.clearTimeout(autoClose);
  }, [noticePopup]);

  // First-login passport users: suggest A2HS after any stamp notice clears (or right away).
  useEffect(() => {
    if (!isAuthenticated || !isFirstLoginUser || !userId) {
      setAddToHomeEligible(false);
      return;
    }
    if (noticePopup) {
      setAddToHomeEligible(false);
      return;
    }
    const t = window.setTimeout(() => setAddToHomeEligible(true), 500);
    return () => window.clearTimeout(t);
  }, [isAuthenticated, isFirstLoginUser, userId, noticePopup]);

  const pageContent = (
    <>
      <div className={`py-2 sm:py-4 px-2 sm:px-4 ${isAuthenticated ? "pb-6" : "pb-6"}`}>
      <div className="max-w-lg sm:max-w-2xl mx-auto">
        {!isAuthenticated && (
          <PasaporteInfoCard className="mb-5 sm:mb-6" pendingStamp={pendingStamp} />
        )}

        {isPreview && !pendingStamp && (
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif-cluster text-[#3d2914] text-center mb-5 sm:mb-6 tracking-wide leading-tight">
            Llénalo todo. Hazte Poblano.
          </h2>
        )}
        {isPreview && pendingStamp && (
          <p className="text-center text-sm text-[#5c3d1e]/90 mb-5 sm:mb-6 font-medium">
            Vista previa del Pasaporte — al continuar con Google se registrará el sello en{" "}
            <span className="font-bold">{pendingStamp.name}</span>.
          </p>
        )}

        <div className="relative isolate rounded-xl sm:rounded-2xl border border-[#c9b896] bg-[#faf6ef] shadow-[0_12px_40px_rgba(80,55,20,0.14)] overflow-hidden">
          <SecurityPatternBackground
            opacity={isPreview ? 0.12 : 0.09}
            density={isPreview ? 1.08 : 0.98}
            className="text-stone-500"
          />
          <div
            className="absolute inset-0 opacity-[0.22] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(160,120,60,0.06) 24px, rgba(160,120,60,0.06) 25px)",
            }}
          />

          <div className="relative z-10">
          {/* Hoja de identificación */}
          <div className="px-4 sm:px-8 pt-5 sm:pt-7 pb-6 border-b border-[#d9cdb3]">
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
            <div ref={previewStampsRef} className="relative">
              {!isPreview && (
                <p className="passport-value text-[11px] sm:text-xs text-center text-stone-500/80 mb-4 sm:mb-5">
                  Toca un sello para verlo en el MAP
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
              {restaurants.map((restaurant, index) => {
                const stamp = stampMap[restaurant.id];
                const hasStamp = isPreview
                  ? previewScroll.visibleStampIds.has(restaurant.id)
                  : Boolean(stamp?.count);
                const colorClass = STAMP_OUTLINE_COLORS[index % STAMP_OUTLINE_COLORS.length];
                const isFlashing = stampFlashId === restaurant.id;

                return (
                  <Link
                    key={restaurant.id}
                    href={getMapHrefForRestaurant(restaurant.id)}
                    data-stamp-id={restaurant.id}
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
                            ? `${colorClass} border-solid scale-100 ${
                                isPreview ? stampTiltClass(restaurant.id) : "rotate-[-8deg]"
                              }`
                            : "border-dashed border-stone-300 scale-95"
                        } ${isFlashing ? "animate-stamp-press" : ""}`}
                      >
                        {hasStamp && (
                          <Image
                            src={restaurant.logoUrl?.trim() || `/logos/${restaurant.foto}.png`}
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
              {isPreview && (
                <div className="flex flex-col items-center justify-center px-4 sm:px-8 pt-8 pb-6 sm:pt-10 sm:pb-8 text-center">
                  <p className="text-2xl sm:text-3xl md:text-[2.125rem] font-black font-serif-cluster text-[#8b6b3e] leading-tight tracking-wide max-w-lg">
                    ¿Dónde está tu próximo sello?
                  </p>
                  <p className="mt-3 text-base sm:text-lg text-[#9a8060] font-light leading-relaxed max-w-md">
                    Recorre el barrio en el MAP y encuentra los lugares que sellan tu pasaporte.
                  </p>
                  <Link
                    href="/map"
                    className="mt-6 sm:mt-7 inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm sm:text-base uppercase tracking-[0.2em] px-10 sm:px-12 py-4 sm:py-[1.125rem] rounded-lg transition shadow-lg active:scale-[0.98]"
                  >
                    Entrar al MAP
                  </Link>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>

        {!isPreview && (
          <div className="mt-4 mb-1 max-w-sm mx-auto px-2">
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-lg transition shadow-sm active:scale-[0.98]"
            >
              <Camera className="w-4 h-4" strokeWidth={2.25} />
              Escanear QR
            </button>
          </div>
        )}

        <p className="mt-5 mb-1 text-center max-w-sm mx-auto px-2">
          {alreadyOnPassportRoster ? (
            <span
              className="text-[10px] text-slate-300 cursor-default select-none"
              title="Tu plan de negocio ya incluye presencia en el Pasaporte Digital"
            >
              Ya formas parte del Pasaporte Digital con tu plan de negocio.
            </span>
          ) : (
            <Link
              href="/planes?tipo=comerciales&plan=negocio_familiar#negocio_familiar"
              className="text-[10px] text-slate-400 hover:text-[#27366D] transition underline decoration-dotted underline-offset-2"
            >
              ¿Quieres estar en el Pasaporte Digital? Regístrate aquí.
            </Link>
          )}
        </p>
      </div>
      </div>

      <QrScanModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        hint="Apunta al QR del negocio o hito. Se lee solo al enfocar, sin tomar foto."
      />

      {userId ? (
        <AddToHomeScreenModal
          userId={userId}
          eligible={addToHomeEligible}
          purpose="pasaporte"
        />
      ) : null}

      {noticePopup && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 pointer-events-none">
          <div
            role="status"
            className={`pointer-events-auto relative w-full max-w-sm rounded-2xl border shadow-2xl p-5 animate-popup-in ${
              noticePopup.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : noticePopup.type === "error"
                  ? "bg-red-50 border-red-200 text-red-900"
                  : "bg-amber-50 border-amber-200 text-amber-950"
            }`}
          >
            <button
              type="button"
              onClick={() => setNoticePopup(null)}
              className="absolute top-3 right-3 text-current/50 hover:text-current"
              aria-label="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1 pr-6">
              {noticePopup.type === "success"
                ? "Sello agregado"
                : noticePopup.type === "error"
                  ? "No se pudo sellar"
                  : "Aviso"}
            </p>
            <p className="text-sm font-medium leading-relaxed pr-6">{noticePopup.text}</p>
          </div>
        </div>
      )}
    </>
  );

  if (usePageScroll) {
    return <div className="bg-[#e8e0d0]">{pageContent}</div>;
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#e8e0d0]"
    >
      {pageContent}
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
