"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { Camera, Gift, Settings } from "lucide-react";
import { createBenefitCredential } from "../panel/actions";
import QrScanModal from "../components/QrScanModal";

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
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [credError, setCredError] = useState<string | null>(null);
  const [loadingCred, setLoadingCred] = useState(true);
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [scannerOpen, setScannerOpen] = useState(false);

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
          width: 360,
          margin: 1,
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

  return (
    <div className="h-full min-h-0 flex flex-col relative px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="absolute top-2 right-4 z-10">
        <Link
          href="/panel"
          className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#27366D]/25 bg-white text-[#27366D] hover:bg-slate-50 shadow-sm transition"
          aria-label="Configuración / Mi Panel"
          title="Configuración"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex-1 min-h-0 flex flex-col justify-between gap-3 max-w-lg mx-auto w-full overflow-hidden">
        <section className="flex flex-col items-center text-center shrink-0 pt-1">
          <div className="w-[min(42vw,11.5rem)] h-[min(42vw,11.5rem)] sm:w-48 sm:h-48 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center overflow-hidden relative">
            {loadingCred && !qrDataUrl && (
              <p className="text-xs text-slate-400 px-4">Generando…</p>
            )}
            {credError && (
              <p className="text-[11px] text-red-700 px-3 leading-relaxed">{credError}</p>
            )}
            {qrDataUrl && !credError && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="QR de credencial BarrID"
                className={`w-full h-full object-contain p-2 transition-opacity ${loadingCred ? "opacity-40" : "opacity-100"}`}
              />
            )}
          </div>
          {expiresAtMs && !credError ? (
            <p className="mt-2 text-xs font-semibold tabular-nums text-[#27366D]" aria-live="polite">
              Válido por {formatCountdown(secondsLeft)}
            </p>
          ) : loadingCred && qrDataUrl ? (
            <p className="mt-2 text-xs font-medium text-slate-500">Actualizando…</p>
          ) : null}
        </section>

        <section className="bg-[#27366D] text-white rounded-2xl px-4 py-4 border border-[#1e2b58] min-h-0 overflow-y-auto">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 shrink-0 border-2 border-amber-400/40">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.nombre}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-300 text-[#27366D] font-bold text-sm">
                  {user.nombre.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400">BarrID</p>
              <h1 className="text-base font-black font-serif-cluster uppercase tracking-wide truncate">
                {user.nombre}
              </h1>
              <p className="text-[11px] text-slate-300 truncate">{user.email}</p>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-200">
              <span>Pasaporte</span>
              <span>
                {stampedCount}/{totalRestaurants}
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <dl className="mt-3 pt-3 border-t border-white/15 space-y-1.5 text-xs">
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
          className="w-full shrink-0 inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition shadow-sm"
        >
          <Gift className="w-4 h-4" />
          Mis Beneficios
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setScannerOpen(true)}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-50 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_8px_24px_rgba(0,0,0,0.22)] flex items-center justify-center transition active:scale-95"
        aria-label="Escanear QR con la cámara"
      >
        <Camera className="w-6 h-6" strokeWidth={2.25} />
      </button>

      <QrScanModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        hint="Apunta al QR del negocio o hito. Se lee solo al enfocar, sin tomar foto."
        fallbackHref="/pasaporte"
      />
    </div>
  );
}
