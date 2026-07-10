"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { Gift, Settings } from "lucide-react";
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
  isAdmin: boolean;
};

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
  isAdmin,
}: BarrIdClientProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [credError, setCredError] = useState<string | null>(null);
  const [loadingCred, setLoadingCred] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingCred(true);
      setCredError(null);
      const result = await createBenefitCredential();
      if (cancelled) return;
      setLoadingCred(false);
      if (!result.ok) {
        setCredError(result.error);
        return;
      }
      try {
        const url = await QRCode.toDataURL(result.verifyUrl, {
          width: 420,
          margin: 2,
          errorCorrectionLevel: "M",
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setCredError("No se pudo dibujar el QR.");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5 relative">
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
        <div className="w-52 h-52 sm:w-56 sm:h-56 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center overflow-hidden">
          {loadingCred && (
            <p className="text-xs text-slate-400 px-4">Generando credencial…</p>
          )}
          {credError && (
            <p className="text-xs text-red-700 px-4 leading-relaxed">{credError}</p>
          )}
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="QR de credencial BarrID"
              className="w-full h-full object-contain p-3"
            />
          )}
        </div>
        <p className="mt-4 max-w-sm text-sm text-slate-600 font-light leading-relaxed">
          Muestra este QR en el negocio para validar tu membresía activa y canjear tu beneficio.
          Expira en unos minutos; recarga la página si necesitas uno nuevo.
        </p>
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

      {isAdmin && (
        <Link
          href="/admin"
          className="w-full inline-flex items-center justify-center border border-[#27366D] text-[#27366D] hover:bg-[#27366D]/5 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg transition"
        >
          Panel admin
        </Link>
      )}
    </div>
  );
}
