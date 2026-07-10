"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode } from "lucide-react";
import { getPlanLabel } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";
import { createBenefitCredential } from "./actions";

type Props = {
  userName: string;
  plan: MembershipPlan;
  expiryLabel: string;
};

export default function BenefitCredentialCard({ userName, plan, expiryLabel }: Props) {
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
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
      setVerifyUrl(result.verifyUrl);
      try {
        const url = await QRCode.toDataURL(result.verifyUrl, {
          width: 360,
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
    <section className="bg-white border border-amber-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <QrCode className="w-4 h-4 text-amber-700" />
        <h2 className="text-xs font-bold text-amber-800 uppercase tracking-widest">
          Credencial para canjear
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-4 font-light leading-relaxed">
        Muestra este QR al negocio para que valide tu membresía y otorgue el beneficio. Expira en unos
        minutos; recarga la página si necesitas uno nuevo.
      </p>
      {loadingCred && <p className="text-xs text-slate-500">Generando credencial…</p>}
      {credError && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {credError}
        </p>
      )}
      {qrDataUrl && (
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-44 h-44 border border-slate-200 rounded-lg overflow-hidden bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Credencial QR de beneficio" className="w-full h-full" />
          </div>
          <div className="text-sm space-y-1">
            <p className="font-bold text-slate-900">{userName}</p>
            <p className="text-xs text-slate-600">{getPlanLabel(plan)}</p>
            <p className="text-xs text-slate-600">Vigencia: {expiryLabel}</p>
            {verifyUrl && (
              <p className="text-[10px] text-slate-400 break-all font-mono mt-2">{verifyUrl}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
