"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { BookOpen, Gift, Map as MapIcon, Settings } from "lucide-react";
import { createBenefitCredential } from "../panel/actions";

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

function StatusCard({
  user,
  planLabel,
  statusLabel,
  priceLabel,
  expiryLabel,
  renewalLabel,
  stampedCount,
  totalRestaurants,
  progress,
  compact,
}: BarrIdClientProps & { compact?: boolean }) {
  return (
    <section
      className={`bg-[#27366D] text-white rounded-2xl border border-[#1e2b58] relative ${
        compact ? "px-4 py-4" : "px-6 sm:px-8 py-6 sm:py-8"
      }`}
    >
      <Link
        href="/panel"
        className={`absolute inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 text-white hover:bg-white/20 transition ${
          compact ? "top-3 right-3 w-8 h-8" : "top-4 right-4 w-10 h-10"
        }`}
        aria-label="Configuración / Mi Panel"
        title="Configuración"
      >
        <Settings className={compact ? "w-4 h-4" : "w-5 h-5"} />
      </Link>

      <div className={`flex items-center ${compact ? "gap-3 pr-10" : "gap-4 pr-12"}`}>
        <div
          className={`rounded-full overflow-hidden bg-slate-200 shrink-0 border-2 border-amber-400/40 ${
            compact ? "w-12 h-12" : "w-16 h-16"
          }`}
        >
          {user.image ? (
            <Image
              src={user.image}
              alt={user.nombre}
              width={compact ? 48 : 64}
              height={compact ? 48 : 64}
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
          <p
            className={`font-bold uppercase tracking-widest text-amber-400 ${
              compact ? "text-[9px]" : "text-[10px]"
            }`}
          >
            BarrID
          </p>
          <h1
            className={`font-black font-serif-cluster uppercase tracking-wide truncate ${
              compact ? "text-lg" : "text-2xl"
            }`}
          >
            {user.nombre}
          </h1>
          <p className={`text-slate-300 truncate ${compact ? "text-[11px]" : "text-sm"}`}>
            {user.email}
          </p>
        </div>
      </div>

      <div className={compact ? "mt-3" : "mt-5"}>
        <div
          className={`flex items-center justify-between font-semibold text-slate-200 ${
            compact ? "text-[10px]" : "text-xs"
          }`}
        >
          <span>Pasaporte</span>
          <span>
            {stampedCount}/{totalRestaurants}
          </span>
        </div>
        <div className={`rounded-full bg-white/20 overflow-hidden ${compact ? "mt-1.5 h-2" : "mt-2 h-2.5"}`}>
          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <dl
        className={`border-t border-white/15 ${
          compact ? "mt-3 pt-3 space-y-1.5 text-xs" : "mt-5 pt-5 space-y-2.5 text-sm"
        }`}
      >
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
  );
}

export default function BarrIdClient(props: BarrIdClientProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [credError, setCredError] = useState<string | null>(null);
  const [loadingCred, setLoadingCred] = useState(true);
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

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
          width: 520,
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

  const countdown =
    expiresAtMs && !credError ? (
      <p className="font-semibold tabular-nums text-[#27366D]" aria-live="polite">
        Válido por {formatCountdown(secondsLeft)}
      </p>
    ) : loadingCred && qrDataUrl ? (
      <p className="font-medium text-slate-500">Actualizando…</p>
    ) : null;

  const qrBox = (sizeClass: string, textSize: string) => (
    <div
      className={`${sizeClass} bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center overflow-hidden relative`}
    >
      {loadingCred && !qrDataUrl && (
        <p className={`${textSize} text-slate-400 px-4`}>Generando…</p>
      )}
      {credError && (
        <p className={`${textSize} text-red-700 px-3 leading-relaxed`}>{credError}</p>
      )}
      {qrDataUrl && !credError && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrDataUrl}
          alt="QR de credencial BarrID"
          className={`w-full h-full object-contain p-2 sm:p-3 transition-opacity ${loadingCred ? "opacity-40" : "opacity-100"}`}
        />
      )}
    </div>
  );

  return (
    <>
      {/* Mobile: fullscreen compact stack */}
      <div className="md:hidden flex-1 min-h-0 flex flex-col px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex-1 min-h-0 flex flex-col justify-between gap-4 max-w-lg mx-auto w-full">
          <section className="flex flex-col items-center text-center flex-1 min-h-0 justify-center gap-3">
            {qrBox("w-[min(62vw,17rem)] h-[min(62vw,17rem)]", "text-xs")}
            {countdown && <div className="text-sm">{countdown}</div>}
          </section>

          <StatusCard {...props} compact />

          <div className="grid grid-cols-3 gap-2 shrink-0">
            <Link
              href="/pasaporte"
              className="inline-flex flex-col items-center justify-center gap-1 border border-[#27366D]/20 text-[#27366D] font-bold text-[10px] uppercase tracking-wider px-2 py-2.5 rounded-lg hover:bg-slate-50 transition"
            >
              <BookOpen className="w-4 h-4" />
              Pasaporte
            </Link>
            <Link
              href="/map"
              className="inline-flex flex-col items-center justify-center gap-1 border border-[#27366D]/20 text-[#27366D] font-bold text-[10px] uppercase tracking-wider px-2 py-2.5 rounded-lg hover:bg-slate-50 transition"
            >
              <MapIcon className="w-4 h-4" />
              MAP
            </Link>
            <Link
              href="/socios?beneficios=1"
              className="inline-flex flex-col items-center justify-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[9px] uppercase tracking-wider px-1.5 py-2.5 rounded-lg transition shadow-sm leading-tight text-center"
            >
              <Gift className="w-4 h-4" />
              Mis Beneficios
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop: roomy layout with space for footer */}
      <div className="hidden md:block max-w-5xl mx-auto w-full px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
          <section className="flex flex-col items-center text-center">
            {qrBox("w-72 h-72 lg:w-80 lg:h-80", "text-sm")}
            {countdown && <div className="mt-4 text-base">{countdown}</div>}
            <p className="mt-3 text-sm text-slate-500 font-light max-w-xs leading-relaxed">
              Muestra este QR en negocios participantes para canjear tu beneficio.
            </p>
          </section>

          <div className="space-y-5">
            <StatusCard {...props} />
            <Link
              href="/socios?beneficios=1"
              className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm uppercase tracking-wider px-6 py-4 rounded-xl transition shadow-sm"
            >
              <Gift className="w-5 h-5" />
              Mis Beneficios
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/pasaporte"
                className="inline-flex items-center justify-center gap-2 border border-[#27366D]/20 text-[#27366D] font-bold text-xs uppercase tracking-wider px-4 py-3.5 rounded-xl hover:bg-slate-50 transition"
              >
                <BookOpen className="w-4 h-4" />
                Pasaporte
              </Link>
              <Link
                href="/map"
                className="inline-flex items-center justify-center gap-2 border border-[#27366D]/20 text-[#27366D] font-bold text-xs uppercase tracking-wider px-4 py-3.5 rounded-xl hover:bg-slate-50 transition"
              >
                <MapIcon className="w-4 h-4" />
                MAP
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
