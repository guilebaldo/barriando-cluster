import { jsPDF } from "jspdf";
import QRCode from "qrcode";

const PAGE_W = 8.5;
const PAGE_H = 11;
const HALF_H = PAGE_H / 2; // 5.5 — dos displays por carta
const FOLD_X = PAGE_W / 2; // 4.25 — doblez vertical de cada display

const NAVY: [number, number, number] = [39, 54, 109]; // #27366D
const AMBER: [number, number, number] = [245, 158, 11];
const SLATE: [number, number, number] = [100, 116, 139];
const GUIDE: [number, number, number] = [148, 163, 184];

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

function drawPanel(
  doc: jsPDF,
  originY: number,
  opts: {
    businessName: string;
    qrDataUrl: string;
    logoDataUrl: string | null;
  }
) {
  const { businessName, qrDataUrl, logoDataUrl } = opts;
  const pad = 0.28;
  const midX = FOLD_X;
  const leftCx = midX / 2;
  const rightCx = midX + midX / 2;

  // Fondo
  doc.setFillColor(255, 252, 247);
  doc.rect(0, originY, PAGE_W, HALF_H, "F");

  // Mitad izquierda navy (copy)
  doc.setFillColor(...NAVY);
  doc.rect(0, originY, midX, HALF_H, "F");

  // Logo sobre pastilla blanca (PNG es blanco sobre negro)
  if (logoDataUrl) {
    const logoW = 2.55;
    const logoH = 0.48;
    const lx = leftCx - logoW / 2;
    const ly = originY + 0.48;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(lx - 0.12, ly - 0.1, logoW + 0.24, logoH + 0.2, 0.06, 0.06, "F");
    try {
      doc.addImage(logoDataUrl, "PNG", lx, ly, logoW, logoH);
    } catch {
      /* ignore */
    }
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("BARRIANDO", leftCx, originY + 0.9, { align: "center" });
  }

  doc.setTextColor(...AMBER);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("¡Hazte Poblano!", leftCx, originY + 2.2, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const subLines = doc.splitTextToSize(
    "Escanea y sella tu Pasaporte Digital del Barrio",
    midX - pad * 2
  );
  doc.text(subLines, leftCx, originY + 2.75, { align: "center", lineHeightFactor: 1.25 });

  doc.setFontSize(7);
  doc.setTextColor(186, 198, 220);
  doc.text("Cluster Turístico · Centro Histórico de Puebla", leftCx, originY + HALF_H - 0.32, {
    align: "center",
  });

  // Mitad derecha: QR + nombre
  const qrSize = 2.4;
  const qrX = rightCx - qrSize / 2;
  const qrY = originY + 0.78;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.015);
  doc.roundedRect(qrX - 0.14, qrY - 0.14, qrSize + 0.28, qrSize + 0.28, 0.1, 0.1, "FD");
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const nameLines = doc.splitTextToSize(businessName, midX - pad * 2);
  doc.text(nameLines, rightCx, qrY + qrSize + 0.48, { align: "center", lineHeightFactor: 1.15 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...SLATE);
  doc.text("Escanea con tu celular", rightCx, originY + HALF_H - 0.32, {
    align: "center",
  });

  // Guía de doblez
  drawDashedLine(doc, midX, originY + 0.1, midX, originY + HALF_H - 0.1);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...GUIDE);
  doc.text("DOBLEZ", midX + 0.1, originY + HALF_H / 2 + 0.35, { angle: 270 });
}

/**
 * PDF carta con 2 displays apilados (8.5×5.5" c/u), guías de corte y doblez.
 * Devuelve un Blob listo para Web Share o descarga.
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

  drawPanel(doc, 0, panelOpts);
  drawPanel(doc, HALF_H, panelOpts);

  // Corte entre displays
  drawDashedLine(doc, 0.12, HALF_H, PAGE_W - 0.12, HALF_H);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...GUIDE);
  doc.text("CORTE", PAGE_W / 2, HALF_H - 0.07, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(170, 170, 170);
  doc.text(
    "Imprime en carta · Corta por la línea central · Dobla por la vertical · Coloca en mesa",
    PAGE_W / 2,
    PAGE_H - 0.11,
    { align: "center" }
  );

  return doc.output("blob");
}

/** @deprecated Prefer buildPassportTableDisplayPdfBlob + shareOrDownloadFile */
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
