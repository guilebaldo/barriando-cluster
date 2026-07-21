"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, FileDown, QrCode } from "lucide-react";
import { listaSocios } from "@/app/data/socios";
import { buildSellarPath, restaurantSlug } from "@/lib/pasaporte";
import { downloadPassportTableDisplayPdf } from "@/lib/passport-table-display-pdf";

type Props = {
  socioId: number | null;
  businessName: string;
};

export default function EstablishmentQrDownload({ socioId, businessName }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const catalog = socioId != null ? listaSocios.find((s) => s.id === socioId) ?? null : null;
  const nameForSlug = catalog?.name?.trim() || businessName.trim();
  const slug = nameForSlug ? restaurantSlug({ name: nameForSlug }) : null;
  const absoluteUrl =
    typeof window !== "undefined" && slug
      ? `${window.location.origin}${buildSellarPath(slug)}`
      : null;

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

  function handleDownloadPng() {
    if (!dataUrl || !slug) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `qr-sello-${slug}.png`;
    link.click();
  }

  async function handleDownloadPdf() {
    if (!absoluteUrl || !slug || !nameForSlug) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      await downloadPassportTableDisplayPdf({
        businessName: nameForSlug,
        sellarAbsoluteUrl: absoluteUrl,
        fileSlug: slug,
      });
    } catch {
      setPdfError("No se pudo generar el PDF del display.");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <QrCode className="w-4 h-4 text-[#27366D]" />
        <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
          QR del establecimiento
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-4 font-light leading-relaxed">
        Descarga el QR puro o el display para mesa (PDF carta, 2 piezas con guías de corte y
        doblez) para que visitantes sellen su Pasaporte Digital.
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
            <div className="flex flex-col xs:flex-row flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={!dataUrl}
                className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Descargar QR (PNG)
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadPdf()}
                disabled={!absoluteUrl || pdfLoading}
                className="inline-flex items-center justify-center gap-2 bg-[#27366D] hover:bg-[#1e2b58] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition"
              >
                <FileDown className="w-4 h-4" />
                {pdfLoading ? "Generando PDF…" : "Display mesa (PDF)"}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-light leading-relaxed">
              El PDF incluye dos displays iguales por hoja carta, con líneas de <strong>corte</strong>{" "}
              y <strong>doblez</strong>, el logo Barriando y el texto «¡Hazte Poblano!».
            </p>
            {pdfError ? (
              <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {pdfError}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
