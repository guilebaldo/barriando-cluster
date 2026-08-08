"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useImmersiveScrollLock } from "@/app/components/useImmersiveScrollLock";

/**
 * Pasaporte logueado: viewport anclado al visualViewport (iPhone Max / PWA).
 * - padding-top: safe-area → foto/nombre bajo el Dynamic Island
 * - alto = visualViewport → evita franja blanca bajo el hub
 * El padding-bottom del hub sigue viniendo de `.map-immersive-shell` en CSS.
 */
export default function PasaporteImmersiveShell({ children }: { children: ReactNode }) {
  useImmersiveScrollLock();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const vv = window.visualViewport;
    let frame = 0;

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const h = Math.round(vv?.height ?? window.innerHeight);
        if (h > 0) {
          el.style.height = `${h}px`;
          el.style.maxHeight = `${h}px`;
        }
      });
    };

    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);

    return () => {
      cancelAnimationFrame(frame);
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      el.style.removeProperty("height");
      el.style.removeProperty("max-height");
    };
  }, []);

  return (
    <div
      ref={ref}
      className="map-immersive-shell relative z-0 flex flex-col h-[100svh] max-h-[100svh] bg-[#faf6ef] text-slate-900 font-sans antialiased overflow-hidden overscroll-none pt-[env(safe-area-inset-top,0px)]"
    >
      {children}
    </div>
  );
}
