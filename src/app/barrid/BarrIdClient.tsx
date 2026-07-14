"use client";

import { useEffect, useRef, useState } from "react";
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
      <a
        href="/panel"
        className={`absolute z-10 inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 text-white hover:bg-white/20 transition ${
          compact ? "top-3 right-3 w-8 h-8" : "top-4 right-4 w-10 h-10"
        }`}
        aria-label="Configuración / Mi Panel"
        title="Mi Panel"
      >
        <Settings className={compact ? "w-4 h-4" : "w-5 h-5"} />
      </a>

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

function QrPanel({
  sizeClass,
  textSize,
  qrDataUrl,
  loadingCred,
  credError,
  countdown,
  showHint,
}: {
  sizeClass: string;
  textSize: string;
  qrDataUrl: string | null;
  loadingCred: boolean;
  credError: string | null;
  countdown: React.ReactNode;
  showHint?: boolean;
}) {
  return (
    <section className="flex flex-col items-center text-center gap-3">
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
            className={`w-full h-full object-contain p-2.5 sm:p-3 transition-opacity ${
              loadingCred ? "opacity-40" : "opacity-100"
            }`}
          />
        )}
      </div>
      {countdown}
      {showHint && (
        <div className="space-y-1 max-w-xs">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
            Credencial de socio
          </p>
          <p className="text-sm text-slate-600 font-light leading-snug">
            Muestra este QR en el mostrador del negocio participante para canjear tu beneficio. Se
            actualiza solo cada minuto.
          </p>
        </div>
      )}
    </section>
  );
}

export default function BarrIdClient(props: BarrIdClientProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  const [sheetExpanded, setSheetExpanded] = useState(false);
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

  function onSheetTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0]?.clientY ?? null;
  }

  function onSheetTouchEnd(e: React.TouchEvent) {
    const start = touchStartY.current;
    touchStartY.current = null;
    if (start == null) return;
    const end = e.changedTouches[0]?.clientY;
    if (end == null) return;
    const delta = start - end;
    if (delta > 40) setSheetExpanded(true);
    if (delta < -40) setSheetExpanded(false);
  }

  const countdown =
    expiresAtMs && !credError ? (
      <p className="font-semibold tabular-nums text-[#27366D] text-sm" aria-live="polite">
        Válido por {formatCountdown(secondsLeft)}
      </p>
    ) : loadingCred && qrDataUrl ? (
      <p className="font-medium text-slate-500 text-sm">Actualizando…</p>
    ) : null;

  const actionButtons = (
    <>
      <Link
        href="/socios?beneficios=1"
        className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider px-4 py-3 sm:py-4 rounded-xl transition shadow-sm"
      >
        <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
        Mis Beneficios
      </Link>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Link
          href="/pasaporte"
          className="inline-flex items-center justify-center gap-1.5 border border-[#27366D]/20 text-[#27366D] font-bold text-[11px] sm:text-xs uppercase tracking-wider px-3 py-3 sm:py-3.5 rounded-xl hover:bg-slate-50 transition"
        >
          <BookOpen className="w-4 h-4" />
          Pasaporte
        </Link>
        <Link
          href="/map"
          className="inline-flex items-center justify-center gap-1.5 border border-[#27366D]/20 text-[#27366D] font-bold text-[11px] sm:text-xs uppercase tracking-wider px-3 py-3 sm:py-3.5 rounded-xl hover:bg-slate-50 transition"
        >
          <MapIcon className="w-4 h-4" />
          MAP
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* —— Móvil: QR fijo de fondo + ficha casi fullscreen —— */}
      <div className="md:hidden relative h-full w-full overflow-hidden overscroll-none">
        {/* Fondo fijo: no se mueve al abrir la ficha */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pb-28 pt-2 pointer-events-none">
          <QrPanel
            sizeClass="w-[min(72vw,20rem)] h-[min(72vw,20rem)]"
            textSize="text-xs"
            qrDataUrl={qrDataUrl}
            loadingCred={loadingCred}
            credError={credError}
            countdown={countdown}
            showHint
          />
        </div>

        <div
          className={`absolute inset-x-0 z-20 transition-[top] duration-300 ease-out ${
            sheetExpanded ? "top-1 bottom-0" : "bottom-0 top-auto"
          } pb-[max(0.25rem,env(safe-area-inset-bottom))]`}
        >
          <div
            ref={sheetRef}
            className={`mx-auto w-full h-full bg-white border border-slate-200 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col transition-[max-height,border-radius] duration-300 ease-out overscroll-contain ${
              sheetExpanded
                ? "rounded-t-2xl border-b-0"
                : "max-h-[6.5rem] rounded-t-2xl border-b-0"
            }`}
            onTouchStart={onSheetTouchStart}
            onTouchEnd={onSheetTouchEnd}
          >
            <button
              type="button"
              onClick={() => setSheetExpanded((v) => !v)}
              className={`w-full flex justify-center touch-manipulation shrink-0 ${
                sheetExpanded ? "pt-2.5 pb-1 border-b border-slate-100/80" : "pt-2.5 pb-2"
              }`}
              aria-expanded={sheetExpanded}
              aria-label={sheetExpanded ? "Ocultar ficha" : "Mostrar ficha"}
            >
              <span className="w-10 h-1 rounded-full bg-slate-300" />
            </button>

            {!sheetExpanded && (
              <button
                type="button"
                onClick={() => setSheetExpanded(true)}
                className="w-full px-4 pb-2.5 text-center touch-manipulation"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                  Mi membresía
                </p>
                <p className="text-sm font-semibold text-[#27366D] truncate leading-tight mt-0.5">
                  {props.user.nombre} · {props.planLabel}
                </p>
              </button>
            )}

            {sheetExpanded && (
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-3.5 pt-3 pb-4 space-y-3">
                <StatusCard {...props} compact />
                {actionButtons}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* —— Escritorio: dos columnas separadas (como antes) —— */}
      <div className="hidden md:block max-w-5xl mx-auto w-full px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
          <QrPanel
            sizeClass="w-72 h-72 lg:w-80 lg:h-80"
            textSize="text-sm"
            qrDataUrl={qrDataUrl}
            loadingCred={loadingCred}
            credError={credError}
            countdown={
              expiresAtMs && !credError ? (
                <p className="mt-1 font-semibold tabular-nums text-[#27366D] text-base" aria-live="polite">
                  Válido por {formatCountdown(secondsLeft)}
                </p>
              ) : loadingCred && qrDataUrl ? (
                <p className="mt-1 font-medium text-slate-500 text-base">Actualizando…</p>
              ) : null
            }
            showHint
          />
          <div className="space-y-5">
            <StatusCard {...props} />
            {actionButtons}
          </div>
        </div>
      </div>
    </>
  );
}
