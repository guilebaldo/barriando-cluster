"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";

function extractInternalPath(raw: string): string | null {
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

export default function QrScanModal({
  open,
  onClose,
  fallbackHref,
}: {
  open: boolean;
  onClose: () => void;
  fallbackHref?: string;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleScan = useCallback(
    (value: string) => {
      const path = extractInternalPath(value);
      if (path) {
        stopCamera();
        onClose();
        router.push(path);
        return true;
      }
      return false;
    },
    [onClose, router, stopCamera]
  );

  useEffect(() => {
    if (!open) {
      stopCamera();
      setError(null);
      return;
    }

    let cancelled = false;

    async function start() {
      setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setSupported(false);
        setError("Tu navegador no permite abrir la cámara desde aquí.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }

        const Detector = (
          window as Window & {
            BarcodeDetector?: new (options?: { formats: string[] }) => {
              detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
            };
          }
        ).BarcodeDetector;
        if (!Detector) {
          setSupported(false);
          setError("Escaneo automático no disponible en este navegador. Usa el enlace manual abajo.");
          return;
        }

        const detector = new Detector({ formats: ["qr_code"] });

        const tick = async () => {
          if (cancelled || !videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }
          try {
            const codes = await detector.detect(videoRef.current);
            for (const code of codes) {
              if (code.rawValue && handleScan(code.rawValue)) return;
            }
          } catch {
            // ignore frame errors
          }
          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      } catch {
        setSupported(false);
        setError("No pudimos acceder a la cámara. Revisa los permisos del navegador.");
      }
    }

    void start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, handleScan, stopCamera]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="text-sm font-bold uppercase tracking-wider">Escanear QR</p>
        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center"
          aria-label="Cerrar escáner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 relative mx-4 mb-4 rounded-2xl overflow-hidden bg-black">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <div className="absolute inset-8 border-2 border-amber-400/80 rounded-xl pointer-events-none" />
        {!supported && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-black/70">
            <Camera className="w-10 h-10 text-amber-400 mb-3" />
            <p className="text-sm font-light">{error}</p>
          </div>
        )}
      </div>

      <div className="px-4 pb-6 text-center space-y-3">
        {error && supported && <p className="text-xs text-amber-200">{error}</p>}
        <p className="text-xs text-slate-300 font-light">
          Apunta al código QR del negocio o hito para validar tu visita en el Pasaporte.
        </p>
        {fallbackHref && (
          <a
            href={fallbackHref}
            className="inline-block text-xs font-bold uppercase tracking-wider text-amber-400 underline"
          >
            Ir a Mi Pasaporte
          </a>
        )}
      </div>
    </div>
  );
}
