"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, FileDown, QrCode, Share2 } from "lucide-react";
import { listaSocios } from "@/app/data/socios";
import { buildSellarPath, restaurantSlug } from "@/lib/pasaporte";
import { buildPassportTableDisplayPdfBlob } from "@/lib/passport-table-display-pdf";
import {
  canShareFiles,
  dataUrlToFile,
  shareOrDownloadFile,
} from "@/lib/share-file";

type Props = {
  socioId: number | null;
  businessName: string;
};

export default function EstablishmentQrDownload({ socioId, businessName }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pngLoading, setPngLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [shareCapable, setShareCapable] = useState(false);

  const catalog = socioId != null ? listaSocios.find((s) => s.id === socioId) ?? null : null;
  const nameForSlug = catalog?.name?.trim() || businessName.trim();
  const slug = nameForSlug ? restaurantSlug({ name: nameForSlug }) : null;
  const absoluteUrl =
    typeof window !== "undefined" && slug
      ? `${window.location.origin}${buildSellarPath(slug)}`
      : null;

  useEffect(() => {
    setShareCapable(canShareFiles());
  }, []);

  useEffect(() => {
    if (!absoluteUrl) {
      setDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(absoluteUrl, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo generar el QR.");
      });
    return () => {
      cancelled = true;
    };
  }, [absoluteUrl]);

  async function handleSharePng() {
    if (!dataUrl || !slug) return;
    setPngLoading(true);
    setActionError(null);
    try {
      const file = await dataUrlToFile(dataUrl, `qr-sello-${slug}.png`, "image/png");
      const result = await shareOrDownloadFile(file, {
        title: `QR Pasaporte · ${nameForSlug}`,
        text: "Escanea para sellar el Pasaporte Digital del Barrio",
      });
      if (result === "aborted") {
        /* usuario canceló la hoja de compartir */
      }
    } catch {
      setActionError("No se pudo compartir ni descargar el QR.");
    } finally {
      setPngLoading(false);
    }
  }

  async function handleSharePdf() {
    if (!absoluteUrl || !slug || !nameForSlug) return;
    setPdfLoading(true);
    setActionError(null);
    try {
      const blob = await buildPassportTableDisplayPdfBlob({
        businessName: nameForSlug,
        sellarAbsoluteUrl: absoluteUrl,
      });
      const file = new File([blob], `display-pasaporte-${slug}.pdf`, {
        type: "application/pdf",
      });
      await shareOrDownloadFile(file, {
        title: `Display mesa · ${nameForSlug}`,
        text: "Display imprimible del Pasaporte Digital (2 por carta)",
      });
    } catch {
      setActionError("No se pudo compartir ni descargar el PDF del display.");
    } finally {
      setPdfLoading(false);
    }
  }

  const pngLabel = shareCapable
    ? pngLoading
      ? "Abriendo…"
      : "Compartir / guardar QR"
    : pngLoading
      ? "Descargando…"
      : "Descargar QR (PNG)";

  const pdfLabel = shareCapable
    ? pdfLoading
      ? "Generando…"
      : "Compartir display (PDF)"
    : pdfLoading
      ? "Generando PDF…"
      : "Display mesa (PDF)";

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <QrCode className="w-4 h-4 text-[#27366D]" />
        <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
          QR del establecimiento
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-4 font-light leading-relaxed">
        {shareCapable
          ? "En el celular puedes compartir o guardar el QR y el display para mesa con la hoja nativa (Archivos, Fotos, AirDrop…)."
          : "Descarga el QR puro o el display para mesa (PDF carta, 2 piezas con guías de corte y doblez)."}
      </p>

      {!slug ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
          Indica el nombre de tu negocio (o vincula un socio del catálogo) para generar el QR de
          sello del Pasaporte. También puedes pedírselo al administrador en /admin.
        </p>
      ) : (
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-40 h-40 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl} alt={`QR de ${nameForSlug}`} className="w-full h-full" />
            ) : (
              <span className="text-[10px] text-slate-400">{error ?? "Generando…"}</span>
            )}
          </div>
          <div className="space-y-3 min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">{nameForSlug}</p>
            <p className="text-[11px] text-slate-500 break-all font-mono">{absoluteUrl}</p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleSharePng()}
                disabled={!dataUrl || pngLoading}
                className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition"
              >
                {shareCapable ? <Share2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                {pngLabel}
              </button>
              <button
                type="button"
                onClick={() => void handleSharePdf()}
                disabled={!absoluteUrl || pdfLoading}
                className="inline-flex items-center justify-center gap-2 bg-[#27366D] hover:bg-[#1e2b58] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition"
              >
                {shareCapable ? <Share2 className="w-4 h-4" /> : <FileDown className="w-4 h-4" />}
                {pdfLabel}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-light leading-relaxed">
              El PDF trae <strong>2 displays</strong> (4 QR: frente cream + dorso navy). Corta por la
              vertical, dobla por la horizontal; el dorso va rotado para leerse de pie.
            </p>
            {actionError ? (
              <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {actionError}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
