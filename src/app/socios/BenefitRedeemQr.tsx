"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { createBenefitCredential } from "@/app/panel/actions";

/** QR compacto de credencial BarrID para el popup de beneficios en /socios. */
export default function BenefitRedeemQr() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const result = await createBenefitCredential();
      if (cancelled) return;
      if (!result.ok) {
        setLoading(false);
        setError(result.error);
        return;
      }
      try {
        const url = await QRCode.toDataURL(result.verifyUrl, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "M",
        });
        if (!cancelled) {
          setQrDataUrl(url);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("No se pudo generar el QR.");
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-3">
        Muestra este QR al negocio
      </p>
      <div className="mx-auto w-44 h-44 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
        {loading && <p className="text-xs text-slate-400 px-3">Generando…</p>}
        {error && <p className="text-xs text-red-700 px-3 leading-relaxed">{error}</p>}
        {qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="QR de credencial BarrID" className="w-full h-full object-contain p-2" />
        )}
      </div>
      <p className="mt-3 text-[11px] text-slate-600 font-light leading-relaxed">
        El negocio escanea este código para validar tu membresía activa. Expira en unos minutos.
      </p>
    </div>
  );
}
