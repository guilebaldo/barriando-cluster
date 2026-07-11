import jsQR from "jsqr";

export function extractAppPathFromQr(raw: string): string | null {
  try {
    const url = raw.startsWith("http") ? new URL(raw) : new URL(raw, window.location.origin);
    if (
      url.pathname.startsWith("/pasaporte") ||
      url.pathname.startsWith("/beneficios/verificar")
    ) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // fall through to regex
  }

  const pasaporte = raw.match(/\/pasaporte\/sellar\?[^\s"'<>]+/);
  if (pasaporte) return pasaporte[0];

  const beneficio = raw.match(/\/beneficios\/verificar\?[^\s"'<>]+/);
  if (beneficio) return beneficio[0];

  return null;
}

/** @deprecated Prefer extractAppPathFromQr */
export function extractPasaportePathFromQr(raw: string): string | null {
  return extractAppPathFromQr(raw);
}

export async function scanQrFromImageFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  const Detector = (
    window as Window & {
      BarcodeDetector?: new (options?: { formats: string[] }) => {
        detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
      };
    }
  ).BarcodeDetector;

  try {
    if (Detector) {
      const detector = new Detector({ formats: ["qr_code"] });
      const codes = await detector.detect(bitmap);
      for (const code of codes) {
        if (!code.rawValue) continue;
        const path = extractAppPathFromQr(code.rawValue);
        if (path) {
          bitmap.close();
          return path;
        }
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });
    bitmap.close();
    if (!code?.data) return null;
    return extractAppPathFromQr(code.data);
  } catch {
    bitmap.close();
    throw new Error("QR_DECODE_FAILED");
  }
}
