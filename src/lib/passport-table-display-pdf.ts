import { jsPDF } from "jspdf";
import QRCode from "qrcode";

/** Carta portrait: 2 displays (columnas) × 2 caras = 4 QR. */
const PAGE_W = 8.5;
const PAGE_H = 11;
const COL_W = PAGE_W / 2; // 4.25 — CORTE vertical
const FACE_H = PAGE_H / 2; // 5.5 — DOBLEZ horizontal (pico del tent)

const NAVY = "#27366D";
const AMBER = "#F59E0B";
const CREAM = "#FFFCF7";
const SLATE = "#475569";
const GUIDE: [number, number, number] = [148, 163, 184];

/** PPI al rasterizar cada cara (nitidez en impresión). */
const FACE_PPI = 180;

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar imagen: ${src.slice(0, 48)}`));
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

function pt(scale: number, size: number): number {
  return Math.round(size * (scale / 72));
}

/**
 * Quita el fondo oscuro/negro del PNG del logo y deja solo las letras claras.
 * En cream: letras blancas (sobre pastilla navy). En navy: letras blancas directas.
 */
function logoGlyphsCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const lum = (px[i] + px[i + 1] + px[i + 2]) / 3;
    const alpha = px[i + 3];
    if (alpha < 12 || lum < 48) {
      px[i + 3] = 0;
    } else {
      // Letras blancas; alpha sigue el brillo para suavizar bordes
      px[i] = 255;
      px[i + 1] = 255;
      px[i + 2] = 255;
      px[i + 3] = Math.round((alpha / 255) * lum);
    }
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

/**
 * Rasteriza una cara del display (título → QR → nombre → subtítulo → logo).
 * Coordenadas: y=0 = “arriba” de la cara (pico del tent al leerse de pie).
 */
async function renderFacePng(opts: {
  businessName: string;
  qrDataUrl: string;
  logoDataUrl: string | null;
  tone: FaceTone;
  /** Si true, gira 180° en el bitmap (cara superior del pliego: legible al doblar). */
  rotate180: boolean;
}): Promise<string> {
  const w = Math.round(COL_W * FACE_PPI);
  const h = Math.round(FACE_H * FACE_PPI);
  const scale = FACE_PPI; // 1 in → px

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  const isNavy = opts.tone === "navy";
  ctx.fillStyle = isNavy ? NAVY : CREAM;
  ctx.fillRect(0, 0, w, h);

  // Borde interior
  ctx.strokeStyle = isNavy ? "rgba(255,255,255,0.22)" : "#E2E8F0";
  ctx.lineWidth = 0.01 * scale;
  ctx.strokeRect(0.08 * scale, 0.08 * scale, w - 0.16 * scale, h - 0.16 * scale);

  const cx = w / 2;
  const padX = 0.2 * scale;
  const contentW = w - padX * 2;

  // 1. Título (más grande)
  const titleSize = pt(scale, 22);
  ctx.fillStyle = isNavy ? AMBER : NAVY;
  ctx.font = `bold ${titleSize}px Helvetica, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("¡Hazte Poblano!", cx, 0.58 * scale);

  // 2. QR
  const qrSize = Math.min(1.95 * scale, contentW - 0.15 * scale);
  const qrX = cx - qrSize / 2;
  const qrY = 0.88 * scale;
  ctx.fillStyle = "#FFFFFF";
  roundRect(
    ctx,
    qrX - 0.1 * scale,
    qrY - 0.1 * scale,
    qrSize + 0.2 * scale,
    qrSize + 0.2 * scale,
    0.07 * scale
  );
  ctx.fill();
  const qrImg = await loadImage(opts.qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // 3. Nombre (tamaño intacto)
  const nameY = qrY + qrSize + 0.32 * scale;
  ctx.fillStyle = isNavy ? "#FFFFFF" : NAVY;
  ctx.font = `bold ${pt(scale, 9.5)}px Helvetica, Arial, sans-serif`;
  const nameLines = wrapLines(ctx, opts.businessName, contentW);
  const nameLineH = 0.16 * scale;
  nameLines.forEach((line, i) => {
    ctx.fillText(line, cx, nameY + i * nameLineH);
  });

  // 4. Subcopy (casi del tamaño del título)
  const subY = nameY + 0.34 * scale + (nameLines.length - 1) * nameLineH;
  const subSize = pt(scale, 18);
  const subLineH = 0.28 * scale;
  ctx.fillStyle = isNavy ? "#E8EEF8" : SLATE;
  ctx.font = `bold ${subSize}px Helvetica, Arial, sans-serif`;
  const subLines = wrapLines(
    ctx,
    "Escanea y sella tu Pasaporte Digital del Barrio",
    contentW
  );
  subLines.forEach((line, i) => {
    ctx.fillText(line, cx, subY + i * subLineH);
  });

  // 5. Logo más pequeño y no pegado al borde
  const logoAspect = 915 / 302;
  const logoW = Math.min(1.35 * scale, contentW * 0.55);
  const logoH = logoW / logoAspect;
  const subBottom = subY + (subLines.length - 1) * subLineH;
  const logoY = Math.min(subBottom + 0.28 * scale, h - logoH - 0.72 * scale);
  const logoX = cx - logoW / 2;

  // Solo en cream: pastilla navy detrás de las letras blancas.
  // En navy: sin recuadro — letras blancas directo sobre el fondo.
  if (!isNavy) {
    ctx.fillStyle = NAVY;
    roundRect(
      ctx,
      logoX - 0.08 * scale,
      logoY - 0.06 * scale,
      logoW + 0.16 * scale,
      logoH + 0.12 * scale,
      0.04 * scale
    );
    ctx.fill();
  }

  if (opts.logoDataUrl) {
    try {
      const logoImg = await loadImage(opts.logoDataUrl);
      const glyphs = logoGlyphsCanvas(logoImg);
      ctx.drawImage(glyphs, logoX, logoY, logoW, logoH);
    } catch {
      ctx.fillStyle = isNavy ? "#FFFFFF" : "#FFFFFF";
      ctx.font = `bold ${pt(scale, 7)}px Helvetica, Arial, sans-serif`;
      ctx.fillText("BARRIANDO", cx, logoY + logoH * 0.72);
    }
  } else {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${pt(scale, 7)}px Helvetica, Arial, sans-serif`;
    ctx.fillText("BARRIANDO", cx, logoY + logoH * 0.72);
  }

  if (!opts.rotate180) {
    return canvas.toDataURL("image/png");
  }

  // Girar 180° en bitmap (sin CTM de jsPDF — evita caras en blanco)
  const rotated = document.createElement("canvas");
  rotated.width = w;
  rotated.height = h;
  const rctx = rotated.getContext("2d");
  if (!rctx) throw new Error("Canvas no disponible");
  rctx.translate(w, h);
  rctx.rotate(Math.PI);
  rctx.drawImage(canvas, 0, 0);
  return rotated.toDataURL("image/png");
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
 * PDF carta: 2 displays × 2 caras.
 * DOBLEZ = pico del tent. Cara superior (cream) va rotada 180° en el pliego
 * para leerse de pie al doblar; cara inferior (navy) queda upright.
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

  const [creamRotated, navyUpright] = await Promise.all([
    renderFacePng({
      businessName: opts.businessName,
      qrDataUrl,
      logoDataUrl,
      tone: "cream",
      rotate180: true,
    }),
    renderFacePng({
      businessName: opts.businessName,
      qrDataUrl,
      logoDataUrl,
      tone: "navy",
      rotate180: false,
    }),
  ]);

  const doc = new jsPDF({
    unit: "in",
    format: "letter",
    orientation: "portrait",
  });

  for (const colX of [0, COL_W] as const) {
    // Superior: cream ya rotada 180° → al doblar por DOBLEZ se lee de pie
    doc.addImage(creamRotated, "PNG", colX, 0, COL_W, FACE_H);
    // Inferior: navy upright → dorso del tent
    doc.addImage(navyUpright, "PNG", colX, FACE_H, COL_W, FACE_H);

    drawDashedLine(doc, colX + 0.1, FACE_H, colX + COL_W - 0.1, FACE_H);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(...GUIDE);
    doc.text("DOBLEZ", colX + COL_W / 2, FACE_H - 0.06, { align: "center" });
  }

  drawDashedLine(doc, COL_W, 0.12, COL_W, PAGE_H - 0.12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(...GUIDE);
  doc.text("CORTE", COL_W + 0.1, PAGE_H / 2 + 0.4, { angle: 270 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(170, 170, 170);
  doc.text(
    "Corta por la vertical · Dobla por la horizontal (pico) · Cream frente / navy dorso · 4 QR",
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
