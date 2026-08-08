"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, FileDown } from "lucide-react";
import { listaSocios } from "@/app/data/socios";
import { buildSellarPath, restaurantSlug } from "@/lib/pasaporte";
import { canOfferPassportStamp } from "@/lib/plan-visibility";
import { buildPassportTableDisplayPdfBlob } from "@/lib/passport-table-display-pdf";
import {
  dataUrlToFile,
  shareOrDownloadFile,
  shouldOfferNativeShare,
} from "@/lib/share-file";
import { resolveSocioDisplayName } from "@/lib/socio-display-name";
import type { MembershipPlan } from "@/generated/prisma/client";

type Props = {
  businessName: string;
  category?: string | null;
  plan?: MembershipPlan | null;
  socioId?: number | null;
  disabled?: boolean;
};

/** QR de sello + display de mesa — disponible para todo plan de negocio ($600+). */
export default function AdminEstablishmentQrButton({
  businessName,
  plan,
  socioId = null,
  disabled,
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [pngBusy, setPngBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [shareCapable, setShareCapable] = useState(false);

  const catalog = socioId != null ? listaSocios.find((s) => s.id === socioId) ?? null : null;
  const name =
    socioId != null
      ? resolveSocioDisplayName(socioId, businessName, catalog?.name)
      : businessName.trim();
  const canStamp = canOfferPassportStamp(plan) && Boolean(name);
  const slug = canStamp ? restaurantSlug({ name }) : null;
  const absoluteUrl =
    typeof window !== "undefined" && slug
      ? `${window.location.origin}${buildSellarPath(slug)}`
      : null;

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
    const url = `${window.location.origin}${buildSellarPath(slug)}`;
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
    })
      .then((png) => {
        if (!cancelled) setDataUrl(png);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!canStamp) return null;

  async function handleDownloadPng() {
    if (!dataUrl || !slug) return;
    setPngBusy(true);
    try {
      const file = await dataUrlToFile(dataUrl, `qr-sello-${slug}.png`, "image/png");
      await shareOrDownloadFile(file, {
        title: `QR Pasaporte · ${name}`,
        text: "Escanea para sellar el Pasaporte Digital del Barrio",
      });
    } finally {
      setPngBusy(false);
    }
  }

  async function handleSharePdf() {
    if (!absoluteUrl || !slug || !name) return;
    setPdfBusy(true);
    try {
      const blob = await buildPassportTableDisplayPdfBlob({
        businessName: name,
        sellarAbsoluteUrl: absoluteUrl,
      });
      const file = new File([blob], `display-pasaporte-${slug}.pdf`, {
        type: "application/pdf",
      });
      await shareOrDownloadFile(file, {
        title: `Display mesa · ${name}`,
        text: "Display imprimible del Pasaporte Digital (2 por carta)",
      });
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        title={
          shareCapable
            ? "Compartir / guardar QR de sello Pasaporte"
            : "Descargar QR de sello Pasaporte"
        }
        disabled={disabled || !dataUrl || pngBusy}
        onClick={() => void handleDownloadPng()}
        className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 disabled:opacity-40"
      >
        <Download className="w-4 h-4" />
        <span className="sr-only">
          {shareCapable ? "Compartir QR" : "Descargar QR"}
        </span>
      </button>
      <button
        type="button"
        title={
          shareCapable
            ? "Compartir / guardar display de mesa (PDF)"
            : "Descargar display de mesa (PDF)"
        }
        disabled={disabled || !absoluteUrl || pdfBusy}
        onClick={() => void handleSharePdf()}
        className="p-2 rounded-lg text-[#27366D] hover:bg-slate-100 disabled:opacity-40"
      >
        <FileDown className="w-4 h-4" />
        <span className="sr-only">
          {shareCapable ? "Compartir display de mesa" : "Descargar display de mesa"}
        </span>
      </button>
    </>
  );
}
