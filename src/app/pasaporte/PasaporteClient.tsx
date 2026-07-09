"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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

const STAMP_COLORS = [
  "from-emerald-700 to-emerald-900 border-emerald-800",
  "from-red-700 to-red-900 border-red-800",
  "from-blue-800 to-indigo-900 border-blue-900",
] as const;

const MRZ_SLOTS = 28;

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function PassportProgressTrack({
  progress,
  tierId,
}: {
  progress: number;
  tierId: "turista" | "poblano";
}) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimatedProgress(progress);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const duration = 1600;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setAnimatedProgress(Math.round(progress * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [progress]);

  const filledSlots = Math.round((animatedProgress / 100) * MRZ_SLOTS);

  return (
    <div className="mt-5">
      <div className="flex items-end justify-between gap-3 font-passport-mrz text-[11px] sm:text-xs font-bold tracking-[0.14em]">
        <span className={tierId === "turista" ? "text-[#27366D]" : "text-stone-500"}>TURISTA</span>
        <span className={tierId === "poblano" ? "text-amber-700" : "text-stone-500"}>POBLANO</span>
      </div>
      <div
        className="mt-2 font-passport-mrz text-[13px] sm:text-sm leading-none select-none overflow-hidden whitespace-nowrap"
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
      <div className="mt-2 h-1 rounded-full bg-stone-300/70 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            tierId === "poblano"
              ? "bg-gradient-to-r from-amber-500 to-amber-700"
              : "bg-gradient-to-r from-[#27366D] to-[#1e2b58]"
          }`}
          style={{ width: `${animatedProgress}%` }}
        />
      </div>
      <p className="mt-2 text-[10px] font-passport-mrz tracking-widest text-stone-500 uppercase">
        {animatedProgress}% · rango {tierId === "poblano" ? "POBLANO" : "TURISTA"}
      </p>
    </div>
  );
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
  const searchParams = useSearchParams();
  const [showPoblanoCelebration, setShowPoblanoCelebration] = useState(false);

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
    <div className="min-h-[calc(100dvh-4rem)] bg-[#e8e0d0] py-3 sm:py-8 px-2 sm:px-4 pb-8">
      <div className="max-w-lg sm:max-w-2xl mx-auto">
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
                  Clúster Turístico
                </p>
                <h1 className="text-lg sm:text-2xl font-black font-serif-cluster uppercase tracking-[0.12em] text-[#3d2914] leading-tight mt-0.5">
                  Pasaporte Digital
                </h1>
              </div>
              <div className="text-right shrink-0 max-w-[9rem]">
                <p className="passport-label">Zona</p>
                <p className="passport-value text-[11px] sm:text-xs leading-snug mt-0.5">
                  Puebla de Los Ángeles
                </p>
              </div>
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
                      {getInitials(userName) || "?"}
                    </span>
                    <span className="text-[8px] font-passport-mrz tracking-widest mt-1 uppercase">Foto</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-3 pt-0.5">
                <div>
                  <p className="passport-label">Nombre</p>
                  <p className="passport-value text-sm sm:text-base leading-snug mt-0.5 break-words">
                    {userName}
                  </p>
                </div>
                <div>
                  <p className="passport-label">Temporada</p>
                  <p className="passport-value text-[11px] sm:text-xs mt-0.5">Chiles en Nogada</p>
                </div>
                <div>
                  <p className="passport-label">Rango</p>
                  <p
                    className={`passport-value text-[11px] sm:text-xs mt-0.5 flex items-center gap-1.5 ${
                      tierId === "poblano" ? "text-amber-800" : ""
                    }`}
                  >
                    {tierId === "poblano" && <span aria-hidden>★</span>}
                    {tierLabel.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-[#d9cdb3] bg-white/50 px-2 py-2">
                <p className="passport-label text-[9px]">Sellos</p>
                <p className="passport-value text-base mt-0.5">{totalStamps}</p>
              </div>
              <div className="rounded-lg border border-[#d9cdb3] bg-white/50 px-2 py-2">
                <p className="passport-label text-[9px]">Visitados</p>
                <p className="passport-value text-base mt-0.5">
                  {uniqueStamped}/{totalRestaurants}
                </p>
              </div>
              <div className="rounded-lg border border-[#d9cdb3] bg-white/50 px-2 py-2">
                <p className="passport-label text-[9px]">Progreso</p>
                <p className="passport-value text-base mt-0.5">{progress}%</p>
              </div>
            </div>

            <PassportProgressTrack progress={progress} tierId={tierId} />

            {!isAuthenticated && (
              <p className="mt-4 text-[11px] text-amber-950 bg-amber-100/80 border border-amber-200 rounded-lg px-3 py-2.5 leading-relaxed">
                <Link href="/login?callbackUrl=%2Fpasaporte" className="font-bold underline text-[#27366D]">
                  Inicia sesión
                </Link>{" "}
                para guardar tus sellos al escanear los QR en los restaurantes.
              </p>
            )}

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

          {/* Celebración Poblano */}
          <div className="relative px-4 sm:px-8 py-4 border-b border-[#d9cdb3]/70 bg-white/30">
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
            <p className="text-[10px] font-passport-mrz tracking-[0.2em] text-stone-500 uppercase">
              Sellos de temporada · Restaurantes participantes
            </p>
          </div>

          {/* Cuadrícula de sellos */}
          <div className="relative px-4 sm:px-8 py-5 sm:py-7">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
              {restaurants.map((restaurant, index) => {
                const stamp = stampMap[restaurant.id];
                const hasStamp = Boolean(stamp?.count);
                const colorClass = STAMP_COLORS[index % STAMP_COLORS.length];

                return (
                  <div
                    key={restaurant.id}
                    className={`flex flex-col items-center text-center gap-2 ${!hasStamp ? "opacity-40" : ""}`}
                  >
                    <div className="relative">
                      <div
                        className={`w-[4.25rem] h-[4.25rem] sm:w-20 sm:h-20 rounded-full border-2 border-dashed flex flex-col items-center justify-center p-1.5 transition-transform active:scale-95 ${
                          hasStamp
                            ? `bg-gradient-to-br ${colorClass} text-white shadow-md rotate-[-8deg]`
                            : "border-stone-300 bg-stone-100/60 text-stone-400"
                        }`}
                      >
                        {hasStamp ? (
                          <>
                            <span className="text-[7px] font-bold uppercase tracking-wider opacity-90">
                              Barriando
                            </span>
                            <span className="text-[8px] sm:text-[9px] font-black leading-tight text-center line-clamp-2">
                              {restaurant.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-[8px] font-semibold uppercase tracking-wide text-center leading-snug">
                            Pendiente
                          </span>
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

        <p className="text-center text-[10px] text-stone-600 mt-4 max-w-sm mx-auto leading-relaxed font-light px-2">
          Escanea el QR en cada restaurante participante. Un sello por visita cada 18 horas por lugar.
        </p>
      </div>
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
