"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { buildSellarPath, restaurantSlug } from "@/lib/pasaporte";

type Props = {
  businessName: string;
  category?: string | null;
  disabled?: boolean;
};

/** QR compacto para sellos de Pasaporte (negocios de Alimentos y Bebidas). */
export default function AdminEstablishmentQrButton({
  businessName,
  category,
  disabled,
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const canStamp = category?.trim() === "Alimentos y Bebidas" && Boolean(businessName.trim());
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
