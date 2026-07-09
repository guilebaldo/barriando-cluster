export function extractPasaportePathFromQr(raw: string): string | null {
  try {
    const url = raw.startsWith("http") ? new URL(raw) : new URL(raw, window.location.origin);
    if (url.pathname.startsWith("/pasaporte")) return `${url.pathname}${url.search}`;
    const match = raw.match(/\/pasaporte\/sellar\?[^\s"'<>]+/);
    return match ? match[0] : null;
  } catch {
    const match = raw.match(/\/pasaporte\/sellar\?[^\s"'<>]+/);
    return match ? match[0] : null;
  }
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

  if (!Detector) {
    bitmap.close();
    throw new Error("BARCODE_DETECTOR_UNAVAILABLE");
  }

  const detector = new Detector({ formats: ["qr_code"] });
  const codes = await detector.detect(bitmap);
  bitmap.close();

  for (const code of codes) {
    if (!code.rawValue) continue;
    const path = extractPasaportePathFromQr(code.rawValue);
    if (path) return path;
  }

  return null;
}
