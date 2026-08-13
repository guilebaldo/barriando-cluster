"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useImmersiveScrollLock } from "@/app/components/useImmersiveScrollLock";

/**
 * Pasaporte logueado: safe-area superior + alto estable.
 * No re-sincroniza en visualViewport.scroll (en iOS eso provoca un bounce
 * en loop con el track de páginas del libro).
 */
export default function PasaporteImmersiveShell({ children }: { children: ReactNode }) {
  useImmersiveScrollLock({ maxWidthPx: 1023 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let lastH = 0;
    let frame = 0;

    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (mq.matches) {
          el.style.removeProperty("height");
          el.style.removeProperty("max-height");
          lastH = 0;
          return;
        }
        const h = Math.round(window.visualViewport?.height ?? window.innerHeight);
        if (h <= 0 || Math.abs(h - lastH) < 2) return;
        lastH = h;
        el.style.height = `${h}px`;
        el.style.maxHeight = `${h}px`;
      });
    };

    sync();
    mq.addEventListener("change", sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);

    return () => {
      cancelAnimationFrame(frame);
      mq.removeEventListener("change", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      el.style.removeProperty("height");
      el.style.removeProperty("max-height");
    };
  }, []);

  return (
    <div
      ref={ref}
      className="map-immersive-shell relative z-0 flex flex-col h-[100dvh] max-h-[100dvh] bg-[#faf6ef] text-slate-900 font-sans antialiased overflow-hidden overscroll-none pt-[env(safe-area-inset-top,0px)] lg:h-auto lg:max-h-none lg:min-h-screen lg:overflow-visible lg:overscroll-auto"
    >
      {children}
    </div>
  );
}
