"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { buildSellarPath, restaurantSlug } from "@/lib/pasaporte";
import { isSeasonalStampCategory } from "@/lib/plan-visibility";
import type { MembershipPlan } from "@/generated/prisma/client";

type Props = {
  businessName: string;
  category?: string | null;
  plan?: MembershipPlan | null;
  disabled?: boolean;
};

/** QR compacto para sellos de temporada (Gran Empresa de AyB u Hotel). */
export default function AdminEstablishmentQrButton({
  businessName,
  category,
  plan,
  disabled,
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const canStamp =
    plan === "GRAN_EMPRESA" &&
    isSeasonalStampCategory(category?.trim()) &&
    Boolean(businessName.trim());
  const slug = canStamp ? restaurantSlug({ name: businessName.trim() }) : null;

  useEffect(() => {
    if (!slug || typeof window === "undefined") {
      setDataUrl(null);
      return;
    }
    const absoluteUrl = `${window.location.origin}${buildSellarPath(slug)}`;
    let cancelled = false;
    QRCode.toDataURL(absoluteUrl, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!canStamp) return null;

  function handleDownload() {
    if (!dataUrl || !slug) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `qr-sello-${slug}.png`;
    link.click();
  }

  return (
    <button
      type="button"
      title="Descargar QR de sello Pasaporte"
      disabled={disabled || !dataUrl}
      onClick={handleDownload}
      className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 disabled:opacity-40"
    >
      <Download className="w-4 h-4" />
      <span className="sr-only">Descargar QR</span>
    </button>
  );
}
