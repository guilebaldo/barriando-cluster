"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Camera, Gift, Settings } from "lucide-react";
import { createBenefitCredential } from "../panel/actions";
import { scanQrFromImageFile } from "@/lib/qr-scan-client";

type BarrIdClientProps = {
  user: {
    nombre: string;
    email: string;
    image: string | null;
  };
  planLabel: string;
  statusLabel: string;
  priceLabel: string;
  expiryLabel: string;
  renewalLabel: string;
  stampedCount: number;
  totalRestaurants: number;
  progress: number;
};

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function BarrIdClient({
  user,
  planLabel,
  statusLabel,
  priceLabel,
  expiryLabel,
  renewalLabel,
  stampedCount,
  totalRestaurants,
  progress,
}: BarrIdClientProps) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [credError, setCredError] = useState<string | null>(null);
  const [loadingCred, setLoadingCred] = useState(true);
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingCred(true);
      setCredError(null);
      const result = await createBenefitCredential();
      if (cancelled) return;
      if (!result.ok) {
        setLoadingCred(false);
        setCredError(result.error);
        setQrDataUrl(null);
        setExpiresAtMs(null);
        setSecondsLeft(0);
        return;
      }
      try {
        const url = await QRCode.toDataURL(result.verifyUrl, {
          width: 420,
          margin: 2,
          errorCorrectionLevel: "M",
        });
        if (cancelled) return;
        setQrDataUrl(url);
        const expiresAt = Date.now() + result.expiresInSeconds * 1000;
        setExpiresAtMs(expiresAt);
        setSecondsLeft(result.expiresInSeconds);
        setLoadingCred(false);
      } catch {
        if (!cancelled) {
          setCredError("No se pudo dibujar el QR.");
          setLoadingCred(false);
          setExpiresAtMs(null);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!expiresAtMs) return;

    const tick = () => {
      setSecondsLeft(Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000)));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAtMs]);

  useEffect(() => {
    if (!expiresAtMs || loadingCred || secondsLeft > 0) return;
    setExpiresAtMs(null);
    setRefreshKey((key) => key + 1);
  }, [expiresAtMs, loadingCred, secondsLeft]);

  const openNativeCamera = useCallback(() => {
    setQrError(null);
    const input = cameraInputRef.current;
    if (!input) return;
    input.setAttribute("capture", "environment");
    input.value = "";
    input.click();
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

  return (
    <div className="space-y-5 relative pb-20">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={handleQrCapture}
      />

      <div className="absolute top-0 right-0 z-10">
        <Link
          href="/panel"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#27366D]/25 bg-white text-[#27366D] hover:bg-slate-50 shadow-sm transition"
          aria-label="Configuración / Mi Panel"
          title="Configuración"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>

      <section className="pt-2 flex flex-col items-center text-center px-2">
        <div className="w-52 h-52 sm:w-56 sm:h-56 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center overflow-hidden relative">
          {loadingCred && !qrDataUrl && (
            <p className="text-xs text-slate-400 px-4">Generando credencial…</p>
          )}
          {credError && (
            <p className="text-xs text-red-700 px-4 leading-relaxed">{credError}</p>
          )}
          {qrDataUrl && !credError && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="QR de credencial BarrID"
              className={`w-full h-full object-contain p-3 transition-opacity ${loadingCred ? "opacity-40" : "opacity-100"}`}
            />
          )}
        </div>
        {expiresAtMs && !credError ? (
          <p
            className="mt-4 text-sm font-semibold tabular-nums text-[#27366D]"
            aria-live="polite"
          >
            Válido por {formatCountdown(secondsLeft)}
          </p>
        ) : loadingCred && qrDataUrl ? (
          <p className="mt-4 text-sm font-medium text-slate-500">Actualizando…</p>
        ) : null}
      </section>

      <section className="bg-[#27366D] text-white rounded-2xl p-6 sm:p-7 border border-[#1e2b58]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 shrink-0 border-2 border-amber-400/40">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.nombre}
                width={56}
                height={56}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-300 text-[#27366D] font-bold text-lg">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">BarrID</p>
            <h1 className="text-xl font-black font-serif-cluster uppercase tracking-wide truncate mt-0.5">
              {user.nombre}
            </h1>
            <p className="text-xs text-slate-300 truncate">{user.email}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
            <span>Pasaporte</span>
            <span>
              {stampedCount}/{totalRestaurants}
            </span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-300 mt-1.5">{progress}% completado</p>
        </div>

        <dl className="mt-5 pt-5 border-t border-white/15 space-y-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-300">Membresía</dt>
            <dd className="font-semibold text-amber-300 text-right">{planLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-300">Estado</dt>
            <dd className="font-semibold text-emerald-300 text-right">{statusLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-300">Cuota</dt>
            <dd className="font-semibold text-white text-right">{priceLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-300">Vencimiento</dt>
            <dd className="font-semibold text-white text-right">{expiryLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-300">Tipo de pago</dt>
            <dd className="font-semibold text-white text-right">{renewalLabel}</dd>
          </div>
        </dl>
      </section>

      <Link
        href="/socios?beneficios=1"
        className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-lg transition shadow-sm"
      >
        <Gift className="w-4 h-4" />
        Ver socios con beneficios
      </Link>

      <button
        type="button"
        onClick={openNativeCamera}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-50 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_8px_24px_rgba(0,0,0,0.22)] flex items-center justify-center transition active:scale-95"
        aria-label="Escanear QR con la cámara"
      >
        <Camera className="w-6 h-6" strokeWidth={2.25} />
      </button>

      {qrError && (
        <p className="fixed bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+4.25rem)] right-4 left-4 z-50 max-w-xs ml-auto text-[11px] text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2 shadow-md">
          {qrError}
        </p>
      )}
    </div>
  );
}
