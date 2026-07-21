import { jsPDF } from "jspdf";
import QRCode from "qrcode";

/** Carta portrait: 2 displays (columnas) × 2 caras = 4 QR. */
const PAGE_W = 8.5;
const PAGE_H = 11;
const COL_W = PAGE_W / 2; // 4.25 — CORTE vertical
const FACE_H = PAGE_H / 2; // 5.5 — DOBLEZ horizontal

const NAVY: [number, number, number] = [39, 54, 109];
const AMBER: [number, number, number] = [245, 158, 11];
const CREAM: [number, number, number] = [255, 252, 247];
const SLATE: [number, number, number] = [71, 85, 105];
const GUIDE: [number, number, number] = [148, 163, 184];

type FaceTone = "cream" | "navy";

async function fetchAsDataUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawDashedLine(
  doc: jsPDF,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  doc.setDrawColor(...GUIDE);
  doc.setLineWidth(0.012);
  doc.setLineDashPattern([0.07, 0.045], 0);
  doc.line(x1, y1, x2, y2);
  doc.setLineDashPattern([], 0);
}

/**
 * Dibuja una cara del display en el rectángulo [x,y,w,h].
 * Orden: título → QR → nombre → subtítulo → logo.
 */
function drawFace(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: {
    businessName: string;
    qrDataUrl: string;
    logoDataUrl: string | null;
    tone: FaceTone;
  }
) {
  const { businessName, qrDataUrl, logoDataUrl, tone } = opts;
  const isNavy = tone === "navy";
  const padX = 0.22;
  const cx = x + w / 2;

  if (isNavy) {
    doc.setFillColor(...NAVY);
  } else {
    doc.setFillColor(...CREAM);
  }
  doc.rect(x, y, w, h, "F");

  // Borde suave interior
  doc.setDrawColor(isNavy ? 55 : 226, isNavy ? 70 : 232, isNavy ? 120 : 240);
  doc.setLineWidth(0.01);
  doc.rect(x + 0.08, y + 0.08, w - 0.16, h - 0.16);

  // 1. Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...(isNavy ? AMBER : NAVY));
  doc.text("¡Hazte Poblano!", cx, y + 0.55, { align: "center" });

  // 2. QR
  const qrSize = Math.min(2.05, w - padX * 2 - 0.2);
  const qrX = cx - qrSize / 2;
  const qrY = y + 0.78;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(qrX - 0.1, qrY - 0.1, qrSize + 0.2, qrSize + 0.2, 0.07, 0.07, "F");
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // 3. Nombre del lugar
  const nameY = qrY + qrSize + 0.38;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...(isNavy ? ([255, 255, 255] as [number, number, number]) : NAVY));
  const nameLines = doc.splitTextToSize(businessName, w - padX * 2);
  doc.text(nameLines, cx, nameY, { align: "center", lineHeightFactor: 1.15 });

  // 4. Subcopy
  const subY = nameY + 0.28 + (nameLines.length - 1) * 0.16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...(isNavy ? ([220, 228, 242] as [number, number, number]) : SLATE));
  const subLines = doc.splitTextToSize(
    "Escanea y sella tu Pasaporte Digital del Barrio",
    w - padX * 2
  );
  doc.text(subLines, cx, subY, { align: "center", lineHeightFactor: 1.2 });

  // 5. Logo abajo (pastilla navy si fondo cream; pastilla blanca si fondo navy)
  const logoW = Math.min(1.85, w - 0.5);
  const logoH = 0.34;
  const logoY = y + h - 0.55;
  const logoX = cx - logoW / 2;

  if (isNavy) {
    doc.setFillColor(255, 255, 255);
  } else {
    doc.setFillColor(...NAVY);
  }
  doc.roundedRect(logoX - 0.1, logoY - 0.08, logoW + 0.2, logoH + 0.16, 0.05, 0.05, "F");

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoW, logoH);
    } catch {
      /* ignore */
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...(isNavy ? NAVY : ([255, 255, 255] as [number, number, number])));
    doc.text("BARRIANDO", cx, logoY + logoH * 0.72, { align: "center" });
  }
}

/** Dibuja una cara rotada 180° (dorso del tent, legible de pie). */
function drawFaceRotated180(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: Parameters<typeof drawFace>[5]
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  doc.saveGraphicsState();
  // x' = -x + 2*cx, y' = -y + 2*cy
  const matrix = doc.Matrix(-1, 0, 0, -1, 2 * cx, 2 * cy);
  doc.setCurrentTransformationMatrix(matrix);
  drawFace(doc, x, y, w, h, opts);
  doc.restoreGraphicsState();
}

function drawDisplayColumn(
  doc: jsPDF,
  colX: number,
  opts: {
    businessName: string;
    qrDataUrl: string;
    logoDataUrl: string | null;
  }
) {
  // Cara superior (cream) — frente
  drawFace(doc, colX, 0, COL_W, FACE_H, {
    ...opts,
    tone: "cream",
  });

  // Cara inferior (navy), rotada 180° — dorso
  drawFaceRotated180(doc, colX, FACE_H, COL_W, FACE_H, {
    ...opts,
    tone: "navy",
  });

  // Guía DOBLEZ horizontal
  drawDashedLine(doc, colX + 0.1, FACE_H, colX + COL_W - 0.1, FACE_H);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(...GUIDE);
  doc.text("DOBLEZ", colX + COL_W / 2, FACE_H - 0.06, { align: "center" });
}

/**
 * PDF carta: 2 displays (columnas) × 2 caras = 4 QR.
 * CORTE vertical al centro; DOBLEZ horizontal a media altura.
 * Dorso rotado 180° para leerse de pie.
 */
export async function buildPassportTableDisplayPdfBlob(opts: {
  businessName: string;
  sellarAbsoluteUrl: string;
}): Promise<Blob> {
  const qrDataUrl = await QRCode.toDataURL(opts.sellarAbsoluteUrl, {
    width: 720,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#27366D", light: "#FFFFFF" },
  });

  const logoDataUrl = await fetchAsDataUrl("/logobarriando.png");

  const doc = new jsPDF({
    unit: "in",
    format: "letter",
    orientation: "portrait",
  });

  const panelOpts = {
    businessName: opts.businessName,
    qrDataUrl,
    logoDataUrl,
  };

  drawDisplayColumn(doc, 0, panelOpts);
  drawDisplayColumn(doc, COL_W, panelOpts);

  // CORTE vertical entre displays
  drawDashedLine(doc, COL_W, 0.12, COL_W, PAGE_H - 0.12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(...GUIDE);
  doc.text("CORTE", COL_W + 0.1, PAGE_H / 2 + 0.4, { angle: 270 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(170, 170, 170);
  doc.text(
    "Corta por la vertical · Dobla por la horizontal · Una cara cream, otra navy · 4 QR por hoja",
    PAGE_W / 2,
    PAGE_H - 0.1,
    { align: "center" }
  );

  return doc.output("blob");
}

export async function downloadPassportTableDisplayPdf(opts: {
  businessName: string;
  sellarAbsoluteUrl: string;
  fileSlug: string;
}): Promise<void> {
  const blob = await buildPassportTableDisplayPdfBlob(opts);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `display-pasaporte-${opts.fileSlug}.pdf`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_500);
}
