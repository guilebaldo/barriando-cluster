"use client";

import { useMemo } from "react";
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
  tierId: "visitante" | "cepa" | "heroe";
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
  progress,
}: PasaporteClientProps) {
  const searchParams = useSearchParams();

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
    tierId === "heroe" ? "text-amber-700" : tierId === "cepa" ? "text-emerald-800" : "text-stone-600";

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-amber-50 via-orange-50/40 to-amber-100/60 py-10 px-4 sm:px-6">
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
          <div className="relative p-6 sm:p-10 border-b border-amber-200/60 bg-gradient-to-r from-amber-100/50 to-orange-50/30">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-800/70 mb-2">
              Temporada · Chiles en Nogada
            </p>
            <h1 className="text-2xl sm:text-3xl font-black font-serif-cluster uppercase tracking-wide text-[#5c3d1e]">
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

          {/* Poblanómetro */}
          <div className="relative px-6 sm:px-10 py-6 border-b border-amber-200/50 bg-white/40">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                  Poblanómetro
                </p>
                <p className={`text-lg font-bold font-serif-cluster ${tierAccent}`}>{tierLabel}</p>
              </div>
              <p className="text-xs text-stone-500">
                <strong className="text-stone-800">{totalStamps}</strong> chiles registrados
              </p>
            </div>
            <div className="h-2.5 rounded-full bg-stone-200/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-red-600 to-blue-800 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-stone-400 mt-2">
              0–2 Visitante · 3–5 Poblano de Cepa · 6+ Héroe del Ejército Trigarante
            </p>
          </div>

          {/* Stamp grid */}
          <div className="relative p-6 sm:p-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-6">
              Restaurantes participantes
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
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
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center p-2 transition ${
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
