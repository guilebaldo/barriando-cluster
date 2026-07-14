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
}: BarrIdClientProps) {
  return (
    <section className="bg-[#27366D] text-white rounded-2xl border border-[#1e2b58] relative px-4 py-4">
      <a
        href="/panel"
        className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/25 bg-white/10 text-white hover:bg-white/20 transition"
        aria-label="Configuración / Mi Panel"
        title="Mi Panel"
      >
        <Settings className="w-4 h-4" />
      </a>

      <div className="flex items-center gap-3 pr-10">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 shrink-0 border-2 border-amber-400/40">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.nombre}
              width={48}
              height={48}
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
          <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400">BarrID</p>
          <h1 className="text-lg font-black font-serif-cluster uppercase tracking-wide truncate">
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

  return (
    <div className="relative h-full w-full overflow-hidden overscroll-none">
      {/* Zona principal: QR + instrucciones (visible con ficha oculta) */}
      <div
        className={`absolute inset-x-0 top-0 flex flex-col items-center px-4 transition-[bottom] duration-300 ${
          sheetExpanded ? "bottom-[min(58vh,480px)]" : "bottom-[6.75rem]"
        }`}
      >
        <div className="flex-1 min-h-0 w-full max-w-sm flex flex-col items-center justify-center gap-3 py-3 text-center">
          <div className="w-[min(68vw,19rem)] h-[min(68vw,19rem)] bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center overflow-hidden relative shrink-0">
            {loadingCred && !qrDataUrl && (
              <p className="text-xs text-slate-400 px-4">Generando…</p>
            )}
            {credError && (
              <p className="text-xs text-red-700 px-3 leading-relaxed">{credError}</p>
            )}
            {qrDataUrl && !credError && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="QR de credencial BarrID"
                className={`w-full h-full object-contain p-2.5 transition-opacity ${
                  loadingCred ? "opacity-40" : "opacity-100"
                }`}
              />
            )}
          </div>

          {countdown}

          <div className="space-y-1 max-w-xs">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
              Credencial de socio
            </p>
            <p className="text-sm text-slate-600 font-light leading-snug">
              Muestra este QR en el mostrador del negocio participante para canjear tu beneficio. Se
              actualiza solo cada minuto.
            </p>
          </div>
        </div>
      </div>

      {/* Ficha inferior (mismo patrón que MAP / socios) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-2 sm:px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div
          ref={sheetRef}
          className={`max-w-lg mx-auto bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-2xl overflow-hidden transition-[max-height] duration-300 ease-out overscroll-contain ${
            sheetExpanded ? "max-h-[min(58vh,480px)]" : "max-h-[6.5rem]"
          }`}
          onTouchStart={onSheetTouchStart}
          onTouchEnd={onSheetTouchEnd}
        >
          <button
            type="button"
            onClick={() => setSheetExpanded((v) => !v)}
            className={`w-full flex justify-center touch-manipulation ${
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
              className="w-full px-3 pb-2.5 text-center touch-manipulation"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                Mi membresía
              </p>
              <p className="text-sm font-semibold text-[#27366D] truncate leading-tight mt-0.5">
                {props.user.nombre} · {props.planLabel}
              </p>
            </button>
          )}

          <div
            className={`p-3.5 space-y-3 overflow-y-auto overscroll-contain touch-pan-y ${
              sheetExpanded ? "max-h-[min(calc(58vh-2.5rem),440px)]" : "hidden"
            }`}
          >
            <StatusCard {...props} />

            <Link
              href="/socios?beneficios=1"
              className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition shadow-sm"
            >
              <Gift className="w-4 h-4" />
              Mis Beneficios
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/pasaporte"
                className="inline-flex items-center justify-center gap-1.5 border border-[#27366D]/20 text-[#27366D] font-bold text-[11px] uppercase tracking-wider px-3 py-3 rounded-xl hover:bg-slate-50 transition"
              >
                <BookOpen className="w-4 h-4" />
                Pasaporte
              </Link>
              <Link
                href="/map"
                className="inline-flex items-center justify-center gap-1.5 border border-[#27366D]/20 text-[#27366D] font-bold text-[11px] uppercase tracking-wider px-3 py-3 rounded-xl hover:bg-slate-50 transition"
              >
                <MapIcon className="w-4 h-4" />
                MAP
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
