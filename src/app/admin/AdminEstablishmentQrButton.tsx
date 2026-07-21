"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Share2 } from "lucide-react";
import { buildSellarPath, restaurantSlug } from "@/lib/pasaporte";
import { canOfferPassportStamp } from "@/lib/plan-visibility";
import { dataUrlToFile, shareOrDownloadFile, shouldOfferNativeShare } from "@/lib/share-file";
import type { MembershipPlan } from "@/generated/prisma/client";

type Props = {
  businessName: string;
  category?: string | null;
  plan?: MembershipPlan | null;
  disabled?: boolean;
};

/** QR de sello Pasaporte — disponible para todo plan de negocio ($600+). */
export default function AdminEstablishmentQrButton({
  businessName,
  plan,
  disabled,
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareCapable, setShareCapable] = useState(false);
  const canStamp = canOfferPassportStamp(plan) && Boolean(businessName.trim());
  const slug = canStamp ? restaurantSlug({ name: businessName.trim() }) : null;

  useEffect(() => {
    const sync = () => setShareCapable(shouldOfferNativeShare());
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

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

  async function handleShare() {
    if (!dataUrl || !slug) return;
    setBusy(true);
    try {
      const file = await dataUrlToFile(dataUrl, `qr-sello-${slug}.png`, "image/png");
      await shareOrDownloadFile(file, {
        title: `QR Pasaporte · ${businessName.trim()}`,
        text: "Escanea para sellar el Pasaporte Digital del Barrio",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      title={shareCapable ? "Compartir / guardar QR de sello Pasaporte" : "Descargar QR de sello Pasaporte"}
      disabled={disabled || !dataUrl || busy}
      onClick={() => void handleShare()}
      className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 disabled:opacity-40"
    >
      {shareCapable ? <Share2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
      <span className="sr-only">{shareCapable ? "Compartir QR" : "Descargar QR"}</span>
    </button>
  );
}
