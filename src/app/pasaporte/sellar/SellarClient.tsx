"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { confirmStampWithLocation } from "./actions";
import { STAMP_MAX_DISTANCE_M } from "@/lib/pasaporte-stamps";

type Props = {
  restaurantSlug: string;
  restaurantName: string;
  requiresLocation: boolean;
};

export default function SellarClient({
  restaurantSlug,
  restaurantName,
  requiresLocation,
}: Props) {
  const router = useRouter();
  const started = useRef(false);
  const [message, setMessage] = useState(
    requiresLocation
      ? "Validando tu ubicación cerca del negocio…"
      : "Registrando tu sello…"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function run() {
      let latitude: number | null = null;
      let longitude: number | null = null;
      let accuracyM: number | null = null;

      if (requiresLocation) {
        if (!navigator.geolocation) {
          setError(
            "Tu navegador no permite GPS. Activa la ubicación o abre este enlace desde el celular en el local."
          );
          return;
        }

        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 20_000,
              maximumAge: 15_000,
            });
          });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
          accuracyM =
            typeof pos.coords.accuracy === "number" && Number.isFinite(pos.coords.accuracy)
              ? pos.coords.accuracy
              : null;
        } catch {
          setError(
            "No pudimos leer tu ubicación. Activa el GPS, permite acceso a Barriando y vuelve a escanear el QR en el local."
          );
          return;
        }
      }

      setMessage("Confirmando sello…");
      const result = await confirmStampWithLocation({
        restaurantSlug,
        latitude,
        longitude,
        accuracyM,
      });

      if (!result.ok) {
        if (result.error === "too_far") {
          setError(
            `Estás a unos ${result.distanceM ?? "?"} m de ${result.restaurantName ?? restaurantName}. Acércate a menos de ${result.maxDistanceM ?? STAMP_MAX_DISTANCE_M} m e intenta de nuevo.`
          );
          return;
        }
        if (result.error === "location_required") {
          setError("Se necesita tu ubicación para validar este sello.");
          return;
        }
        if (result.error === "rate_limited") {
          setError("Demasiados intentos de sello. Espera un momento e intenta de nuevo.");
          return;
        }
        if (result.error === "unauthorized") {
          router.replace(`/login?callbackUrl=${encodeURIComponent(`/pasaporte/sellar?restaurante=${restaurantSlug}`)}`);
          return;
        }
        router.replace(`/pasaporte?error=${result.error}`);
        return;
      }

      if (result.cooldown) {
        const hours = Math.ceil(result.retryAfterMs / (60 * 60 * 1000));
        router.replace(
          `/pasaporte?info=cooldown&restaurante=${encodeURIComponent(restaurantSlug)}&horas=${hours}`
        );
        return;
      }

      router.replace(
        `/pasaporte?sello=ok&restaurante=${encodeURIComponent(restaurantSlug)}&nombre=${encodeURIComponent(result.restaurantName)}`
      );
    }

    void run();
  }, [requiresLocation, restaurantName, restaurantSlug, router]);

  return (
    <main className="flex-1 max-w-lg mx-auto w-full px-6 py-16">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-[#27366D]/10 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-[#27366D]" />
        </div>
        <h1 className="text-xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
          Sellar visita
        </h1>
        <p className="text-sm text-slate-600 font-light leading-relaxed">
          <strong className="font-semibold text-[#27366D]">{restaurantName}</strong>
        </p>
        {error ? (
          <>
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
            <Link
              href="/pasaporte"
              className="inline-flex bg-[#27366D] hover:bg-[#1e2b58] text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition"
            >
              Ir al Pasaporte
            </Link>
          </>
        ) : (
          <p className="text-sm text-slate-500">{message}</p>
        )}
      </div>
    </main>
  );
}
