"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { BookOpen, ChevronRight, Gift, Map as MapIcon } from "lucide-react";
import { createBenefitCredential } from "../panel/actions";
import AddToHomeScreenModal from "./AddToHomeScreenModal";
import PasesMarketplace from "./PasesMarketplace";
import MisPasesSection from "./MisPasesSection";
import { useAppMobileShell } from "@/app/components/AppBottomNav";
import PlanIntentCta from "@/app/components/PlanIntentCta";
import { formatPlanPriceMxn } from "@/lib/membresia";
import type { AccessEventCard } from "@/lib/access-events";

type BarrIdClientProps = {
  user: {
    id: string;
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
  /** Membresía de pago activa: puede generar QR de canje. */
  canRedeemCoupons: boolean;
  /** Cuenta recién creada: mostrar prompt de instalar BarriApp en móvil. */
  isFirstLoginUser?: boolean;
  /** Abrir ficha al montar (vuelta desde Mi cuenta). */
  initialSheetExpanded?: boolean;
  events: AccessEventCard[];
  paseNotice?: "ok" | "cancelado" | null;
};

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Foto + nombre + correo = entrada a Mi cuenta. */
function MiCuentaProfileLink({
  user,
  compact = false,
}: {
  user: BarrIdClientProps["user"];
  compact?: boolean;
}) {
  const photoSize = compact ? 80 : 64;
  return (
    <Link
      href="/panel?from=barrid"
      className={`flex w-full items-center gap-4 rounded-xl text-left text-white transition hover:bg-white/10 active:scale-[0.99] ${
        compact ? "-mx-1 px-1 py-1" : "px-1 py-1"
      }`}
    >
      <div
        className={`rounded-full overflow-hidden bg-slate-200 shrink-0 ${
          compact ? "w-20 h-20 border-[3px] border-amber-400/70" : "w-16 h-16 border-2 border-amber-400/40"
        }`}
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.nombre}
            width={photoSize}
            height={photoSize}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center bg-slate-300 text-[#27366D] font-bold ${
              compact ? "text-2xl" : "text-lg"
            }`}
          >
            {user.nombre.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`font-bold uppercase tracking-widest ${
            compact ? "text-xs text-amber-300" : "text-[10px] text-amber-400"
          }`}
        >
          BarrID
        </p>
        <h1
          className={`font-black uppercase tracking-wide font-sans ${
            compact ? "text-2xl leading-tight" : "text-2xl truncate"
          }`}
        >
          {user.nombre}
        </h1>
        <p className={`text-slate-300 truncate ${compact ? "text-sm mt-1" : "text-sm"}`}>{user.email}</p>
      </div>
      <ChevronRight className="w-5 h-5 shrink-0 opacity-80" />
    </Link>
  );
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
  canRedeemCoupons,
}: BarrIdClientProps) {
  return (
    <section className="bg-[#27366D] text-white rounded-2xl border border-[#1e2b58] relative px-6 sm:px-8 py-6 sm:py-8">
      <MiCuentaProfileLink user={user} />

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
          <span>Pasaporte</span>
          <span>
            {stampedCount}/{totalRestaurants}
          </span>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${progress}%` }} />
        </div>
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
        {canRedeemCoupons ? (
          <>
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
          </>
        ) : null}
      </dl>

      <MisPasesSection />
    </section>
  );
}

function VecinoUpsellPanel({
  sizeClass,
  textSize,
}: {
  sizeClass: string;
  textSize: string;
}) {
  return (
    <section className="flex flex-col items-center text-center gap-3 pointer-events-auto">
      <div
        className={`${sizeClass} bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center overflow-hidden relative px-5 py-5 gap-3`}
      >
        <Gift className="w-10 h-10 text-amber-500 shrink-0" />
        <p className={`${textSize} font-bold text-[#27366D] leading-snug`}>
          Membresía Vecino
        </p>
        <p className="text-sm text-slate-600 font-light leading-snug max-w-[17rem]">
          Adquiere la membresía Vecino para desbloquear tu BarrID y activar los cupones exclusivos
          de los negocios del barrio.
        </p>
        <PlanIntentCta
          plan="VECINO"
          className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-lg transition"
        >
          Ser Vecino · {formatPlanPriceMxn("VECINO")}
        </PlanIntentCta>
      </div>
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
            Muestra este QR en el mostrador del negocio participante para canjear tu cupón. Se
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
  const appShell = useAppMobileShell();
  const canRedeem = props.canRedeemCoupons;

  const [sheetExpanded, setSheetExpanded] = useState(Boolean(props.initialSheetExpanded));
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [credError, setCredError] = useState<string | null>(null);
  const [loadingCred, setLoadingCred] = useState(canRedeem);
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!canRedeem) {
      setLoadingCred(false);
      setQrDataUrl(null);
      setCredError(null);
      setExpiresAtMs(null);
      setSecondsLeft(0);
      return;
    }

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
  }, [refreshKey, canRedeem]);

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
    if (delta > 28) setSheetExpanded(true);
    if (delta < -28) setSheetExpanded(false);
  }

  return (
    <>
      <AddToHomeScreenModal userId={props.user.id} eligible={Boolean(props.isFirstLoginUser)} />

      {/* —— Móvil: Pases + ficha azul —— */}
      <div className="md:hidden relative h-full w-full overflow-hidden overscroll-none">
        <div
          className={`absolute inset-0 flex flex-col px-4 pointer-events-none ${
            appShell
              ? "pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-[8.5rem]"
              : "pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-28"
          }`}
        >
          <div className="flex-1 min-h-0 pointer-events-auto pt-2">
            <PasesMarketplace
              events={props.events}
              notice={props.paseNotice}
            />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
          <div
            ref={sheetRef}
            className={`pointer-events-auto mx-auto w-full bg-[#27366D] text-white flex flex-col rounded-t-3xl overscroll-contain shadow-[0_-16px_48px_rgba(15,23,42,0.45)] transition-[max-height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              sheetExpanded
                ? "max-h-[calc(100dvh-max(0.75rem,env(safe-area-inset-top,0px))-0.5rem)]"
                : "max-h-[6.25rem]"
            }`}
            onTouchStart={onSheetTouchStart}
            onTouchEnd={onSheetTouchEnd}
          >
            <button
              type="button"
              onClick={() => setSheetExpanded((v) => !v)}
              className={`w-full flex justify-center touch-manipulation shrink-0 ${
                sheetExpanded ? "pt-3 pb-2 border-b border-white/15" : "pt-3 pb-2"
              }`}
              aria-expanded={sheetExpanded}
              aria-label={sheetExpanded ? "Ocultar ficha" : "Mostrar ficha"}
            >
              <span className="w-12 h-1.5 rounded-full bg-white/45" />
            </button>

            {!sheetExpanded && (
              <button
                type="button"
                onClick={() => setSheetExpanded(true)}
                className="w-full px-5 pb-4 text-center touch-manipulation shrink-0"
              >
                <p className="text-sm font-bold uppercase tracking-widest text-amber-300">
                  BarrID
                </p>
              </button>
            )}

            {sheetExpanded ? (
              <div className="overflow-y-auto overscroll-contain touch-pan-y px-5 pt-5 pb-5 space-y-5">
                {canRedeem ? (
                  <QrPanel
                    sizeClass="w-[min(68vw,16rem)] h-[min(68vw,16rem)] mx-auto"
                    textSize="text-xs"
                    qrDataUrl={qrDataUrl}
                    loadingCred={loadingCred}
                    credError={credError}
                    countdown={
                      expiresAtMs && !credError ? (
                        <p className="font-semibold tabular-nums text-amber-200 text-sm" aria-live="polite">
                          Válido por {formatCountdown(secondsLeft)}
                        </p>
                      ) : loadingCred && qrDataUrl ? (
                        <p className="font-medium text-slate-300 text-sm">Actualizando…</p>
                      ) : null
                    }
                  />
                ) : (
                  <div className="rounded-2xl bg-white/10 border border-white/15 p-4 text-center space-y-3">
                    <p className="text-sm font-semibold text-white">Membresía Vecino</p>
                    <p className="text-xs text-slate-300 font-light leading-relaxed">
                      Activa tu BarrID para canjear cupones en los negocios del barrio.
                    </p>
                    <PlanIntentCta
                      plan="VECINO"
                      className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-lg transition"
                    >
                      Ser Vecino · {formatPlanPriceMxn("VECINO")}
                    </PlanIntentCta>
                  </div>
                )}

                <MiCuentaProfileLink user={props.user} compact />

                <MisPasesSection compact />

                <p className="pt-1 pb-2 text-center">
                  <a
                    href="https://guilebaldo.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] tracking-wide text-white/30 hover:text-white/50 transition"
                  >
                    Powered by GURU Software Studio
                  </a>
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* —— Escritorio: QR + ficha —— */}
      <div className="hidden md:block max-w-5xl mx-auto w-full px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
          {canRedeem ? (
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
          ) : (
            <VecinoUpsellPanel sizeClass="w-72 min-h-72 lg:w-80 lg:min-h-80" textSize="text-base" />
          )}
          <div className="space-y-5">
            <StatusCard {...props} />
            {canRedeem ? (
              <Link
                href="/cuponera?cupones=1"
                className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm uppercase tracking-wider px-6 py-4 rounded-xl transition shadow-sm"
              >
                <Gift className="w-5 h-5" />
                Mis Cupones
              </Link>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/pasaporte"
                className="inline-flex items-center justify-center gap-2 border border-[#27366D]/20 text-[#27366D] font-bold text-xs uppercase tracking-wider px-4 py-3.5 rounded-xl hover:bg-slate-50 transition"
              >
                <BookOpen className="w-4 h-4" />
                Pasaporte
              </Link>
              <Link
                href="/mapa"
                className="inline-flex items-center justify-center gap-2 border border-[#27366D]/20 text-[#27366D] font-bold text-xs uppercase tracking-wider px-4 py-3.5 rounded-xl hover:bg-slate-50 transition"
              >
                <MapIcon className="w-4 h-4" />
                MAPA
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
