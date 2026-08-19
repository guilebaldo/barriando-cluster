"use client";

import { useEffect } from "react";

const KEYBOARD_OPEN_PX = 100;

/**
 * Mientras el teclado está abierto: esconde el hub y publica `--keyboard-inset`
 * para subir fichas. Sin re-anclar el hub con `top` (eso dejaba offsets raros).
 *
 * En standalone la Cuponera ya no abre teclado (buscador desactivado).
 */
export default function StandaloneViewportFix() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    let frame = 0;
    let closeTimers: number[] = [];

    const clearCloseTimers = () => {
      for (const id of closeTimers) window.clearTimeout(id);
      closeTimers = [];
    };

    const apply = (inset: number, open: boolean) => {
      root.style.setProperty("--keyboard-inset", `${Math.max(0, Math.round(inset))}px`);
      if (open) root.setAttribute("data-keyboard-open", "");
      else root.removeAttribute("data-keyboard-open");
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!vv) {
          apply(0, false);
          return;
        }
        const inset = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
        apply(inset, inset >= KEYBOARD_OPEN_PX);
      });
    };

    const onFocusOut = (event: FocusEvent) => {
      const from = event.target;
      if (from instanceof HTMLElement && from.closest(".admin-touch-forms")) {
        return;
      }

      const next = event.relatedTarget;
      if (
        next instanceof HTMLElement &&
        (next.tagName === "INPUT" || next.tagName === "TEXTAREA" || next.isContentEditable)
      ) {
        return;
      }
      clearCloseTimers();
      closeTimers = [80, 300, 550].map((ms) =>
        window.setTimeout(() => {
          sync();
          if (!root.hasAttribute("data-keyboard-open")) {
            window.scrollTo(0, 0);
          }
        }, ms)
      );
    };

    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("focusout", onFocusOut);
    window.addEventListener("orientationchange", sync);

    return () => {
      cancelAnimationFrame(frame);
      clearCloseTimers();
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("orientationchange", sync);
      root.style.removeProperty("--keyboard-inset");
      root.removeAttribute("data-keyboard-open");
    };
  }, []);

  return null;
}
