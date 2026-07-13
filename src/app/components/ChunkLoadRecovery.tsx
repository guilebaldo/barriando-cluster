"use client";

import { useEffect } from "react";

/** Recarga dura si un deploy dejó chunks viejos (evita pantalla “couldn't load”). */
export default function ChunkLoadRecovery() {
  useEffect(() => {
    function shouldReload(err: unknown): boolean {
      if (!err) return false;
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : typeof err === "object" && err && "message" in err
              ? String((err as { message: unknown }).message)
              : "";
      const name = err instanceof Error ? err.name : "";
      return (
        name === "ChunkLoadError" ||
        /Loading chunk [\w-]+ failed/i.test(message) ||
        /Failed to fetch dynamically imported module/i.test(message) ||
        /ChunkLoadError/i.test(message)
      );
    }

    function onError(event: ErrorEvent) {
      if (shouldReload(event.error ?? event.message)) {
        window.location.reload();
      }
    }

    function onRejection(event: PromiseRejectionEvent) {
      if (shouldReload(event.reason)) {
        window.location.reload();
      }
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
