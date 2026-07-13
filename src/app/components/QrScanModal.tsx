"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { Camera, X } from "lucide-react";
import { extractAppPathFromQr } from "@/lib/qr-scan-client";

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

function getBarcodeDetector():
  | (new (options?: { formats: string[] }) => BarcodeDetectorLike)
  | null {
  return (
    (
      window as Window & {
        BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorLike;
      }
    ).BarcodeDetector ?? null
  );
}

export default function QrScanModal({
  open,
  onClose,
  hint = "Apunta al código QR. Se detecta automáticamente al enfocar.",
  fallbackHref,
  fallbackLabel = "Ir a Mi Pasaporte",
}: {
  open: boolean;
  onClose: () => void;
  hint?: string;
  fallbackHref?: string;
  fallbackLabel?: string;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const handledRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const routerRef = useRef(router);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Iniciando cámara…");

  onCloseRef.current = onClose;
  routerRef.current = router;

  const stopCamera = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setError(null);
      setStatus("Iniciando cámara…");
      handledRef.current = false;
      return;
    }

    let cancelled = false;
    handledRef.current = false;

    const acceptScan = (value: string) => {
      if (handledRef.current) return true;
      const path = extractAppPathFromQr(value);
      if (!path) return false;
      handledRef.current = true;
      stopCamera();
      onCloseRef.current();
      routerRef.current.push(path);
      return true;
    };

    async function start() {
      setError(null);
      setStatus("Iniciando cámara…");

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Tu navegador no permite abrir la cámara desde aquí.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play();
        setStatus("Apunta al QR…");

        const Detector = getBarcodeDetector();
        const detector = Detector ? new Detector({ formats: ["qr_code"] }) : null;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d", { willReadFrequently: true }) ?? null;
        let lastDecodeAt = 0;

        const decodeWithJsQr = (current: HTMLVideoElement) => {
          if (!canvas || !ctx) return false;
          const maxSide = 640;
          const scale = Math.min(1, maxSide / Math.max(current.videoWidth, current.videoHeight));
          const width = Math.max(1, Math.floor(current.videoWidth * scale));
          const height = Math.max(1, Math.floor(current.videoHeight * scale));
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(current, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });
          return Boolean(code?.data && acceptScan(code.data));
        };

        const tick = async () => {
          if (cancelled || handledRef.current || !videoRef.current) return;
          const current = videoRef.current;

          if (current.readyState >= 2 && current.videoWidth > 0) {
            const now = performance.now();
            if (now - lastDecodeAt >= 160) {
              lastDecodeAt = now;
              try {
                let found = false;
                if (detector) {
                  const codes = await detector.detect(current);
                  for (const code of codes) {
                    if (code.rawValue && acceptScan(code.rawValue)) {
                      found = true;
                      break;
                    }
                  }
                }
                if (!found) decodeWithJsQr(current);
              } catch {
                try {
                  decodeWithJsQr(current);
                } catch {
                  // ignore frame decode errors
                }
              }
            }
          }

          if (cancelled || handledRef.current) return;
          rafRef.current = requestAnimationFrame(() => {
            void tick();
          });
        };

        rafRef.current = requestAnimationFrame(() => {
          void tick();
        });
      } catch {
        if (!cancelled) {
          setError("No pudimos acceder a la cámara. Revisa los permisos del navegador.");
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, stopCamera]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between px-4 py-3 text-white shrink-0">
        <p className="text-sm font-bold uppercase tracking-wider">Escanear QR</p>
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center"
          aria-label="Cerrar escáner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 relative mx-4 mb-3 rounded-2xl overflow-hidden bg-black min-h-0">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" aria-hidden />
        <div className="absolute inset-[12%] sm:inset-8 border-2 border-amber-400/80 rounded-xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-black/75">
            <Camera className="w-10 h-10 text-amber-400 mb-3" />
            <p className="text-sm font-light leading-relaxed">{error}</p>
          </div>
        ) : (
          <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/90 font-medium px-4">
            {status}
          </p>
        )}
      </div>

      <div className="px-4 pt-1 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center space-y-2 shrink-0">
        <p className="text-xs text-slate-300 font-light leading-relaxed">{hint}</p>
        {fallbackHref && (
          <a
            href={fallbackHref}
            className="inline-block text-xs font-bold uppercase tracking-wider text-amber-400 underline"
          >
            {fallbackLabel}
          </a>
        )}
      </div>
    </div>
  );
}
