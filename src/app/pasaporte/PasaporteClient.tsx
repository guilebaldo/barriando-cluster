"use client";

import { useEffect, useMemo, useState } from "react";
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
  isAuthenticated: boolean;
  restaurants: RestaurantCard[];
  stampMap: Record<number, { count: number; lastStampAt: string }>;
  totalStamps: number;
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

function PasaporteInner({
  userName,
  isAuthenticated,
  restaurants,
  stampMap,
  totalStamps,
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

  const tierAccent =
    tierId === "poblano" ? "text-amber-600" : "text-stone-600";

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-amber-50 via-orange-50/40 to-amber-100/60 py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Pasaporte cover */}
        <div className="relative rounded-2xl border border-amber-200/80 bg-[#faf6ef] shadow-[0_8px_30px_rgba(120,80,30,0.12)] overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.35] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(180,140,80,0.06) 28px, rgba(180,140,80,0.06) 29px)",
            }}
          />
          <div className="relative p-4 sm:p-10 border-b border-amber-200/60 bg-gradient-to-r from-amber-100/50 to-orange-50/30">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-800/70 mb-2">
              Temporada · Chiles en Nogada
            </p>
            <h1 className="text-xl sm:text-3xl font-black font-serif-cluster uppercase tracking-wide text-[#5c3d1e]">
              Pasaporte Digital
            </h1>
            <p className="text-sm text-stone-600 mt-2 font-light">
              Titular: <strong className="text-stone-800">{userName}</strong>
            </p>

            {!isAuthenticated && (
              <p className="mt-4 text-xs text-amber-900 bg-amber-100/80 border border-amber-200 rounded-lg px-4 py-3">
                <Link href="/login?callbackUrl=%2Fpasaporte" className="font-bold underline text-[#27366D]">
                  Inicia sesión
                </Link>{" "}
                para guardar tus sellos al escanear los QR en los restaurantes.
              </p>
            )}

            {notice && (
              <div
                className={`mt-4 text-xs rounded-lg px-4 py-3 border ${
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

          {/* Rango de temporada */}
          <div className="relative px-4 sm:px-10 py-5 sm:py-6 border-b border-amber-200/50 bg-white/40">
            {showPoblanoCelebration && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-amber-100/90 backdrop-blur-sm animate-pulse rounded-none">
                <div className="text-center px-6 py-4">
                  <span className="text-4xl block mb-2">👑</span>
                  <p className="text-lg font-black font-serif-cluster text-amber-800 uppercase tracking-wide">
                    ¡Eres un verdadero Poblano!
                  </p>
                  <p className="text-xs text-amber-900/80 mt-1">
                    Completaste todos los restaurantes de la temporada
                  </p>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                  Rango MAP · Chiles en Nogada
                </p>
                <p className={`text-lg font-bold font-serif-cluster flex items-center gap-2 ${tierAccent}`}>
                  {tierId === "poblano" && (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-white text-sm shadow-md ring-2 ring-amber-400/50">
                      ★
                    </span>
                  )}
                  {tierLabel}
                </p>
              </div>
              <p className="text-xs text-stone-500">
                <strong className="text-stone-800">{totalStamps}</strong> sellos ·{" "}
                <strong className="text-stone-800">
                  {Object.values(stampMap).filter((s) => s.count > 0).length}
                </strong>{" "}
                restaurantes visitados
              </p>
            </div>
            <div className="h-2.5 rounded-full bg-stone-200/80 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  tierId === "poblano"
                    ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"
                    : "bg-gradient-to-r from-stone-400 to-[#27366D]"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-stone-400 mt-2">
              Empiezas como Turista · Completa todos los restaurantes para la insignia dorada Poblano
            </p>
          </div>

          {/* Stamp grid */}
          <div className="relative p-4 sm:p-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-6">
              Restaurantes participantes
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {restaurants.map((restaurant, index) => {
                const stamp = stampMap[restaurant.id];
                const hasStamp = Boolean(stamp?.count);
                const colorClass = STAMP_COLORS[index % STAMP_COLORS.length];

                return (
                  <div
                    key={restaurant.id}
                    className={`flex flex-col items-center text-center gap-2 ${!hasStamp ? "opacity-45" : ""}`}
                  >
                    <div className="relative">
                      <div
                        className={`w-[4.5rem] h-[4.5rem] sm:w-24 sm:h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center p-2 transition-all active:scale-95 ${
                          hasStamp
                            ? `bg-gradient-to-br ${colorClass} text-white shadow-md rotate-[-8deg]`
                            : "border-stone-300 bg-stone-100/50 text-stone-400"
                        }`}
                      >
                        {hasStamp ? (
                          <>
                            <span className="text-[8px] font-bold uppercase tracking-wider opacity-90">
                              Barriando
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-black leading-tight text-center line-clamp-2">
                              {restaurant.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-[9px] font-semibold uppercase tracking-wide text-center leading-snug">
                            Sello pendiente
                          </span>
                        )}
                      </div>
                      {stamp && stamp.count > 1 && (
                        <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-[#27366D] text-white text-[10px] font-bold flex items-center justify-center shadow">
                          x{stamp.count}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-stone-700 leading-tight line-clamp-2">
                      {restaurant.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-stone-500 mt-6 max-w-md mx-auto leading-relaxed">
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
