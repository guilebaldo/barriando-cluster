"use client";

import { useEffect } from "react";

const KEYBOARD_OPEN_PX = 100;

/**
 * iOS standalone / Safari + teclado nativo:
 * 1) Publica `--keyboard-inset` (alto del teclado) para subir fichas/inputs.
 * 2) Marca `html[data-keyboard-open]` para ocultar el hub mientras se escribe.
 * 3) Al cerrar, resetea scroll y recupera el viewport (evita franja blanca
 *    bajo el hub). Un ::after del hub cubre residuales.
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

    const recoverAfterKeyboard = () => {
      window.scrollTo(0, 0);
      if (document.body.scrollTop) document.body.scrollTop = 0;
      if (root.scrollTop) root.scrollTop = 0;

      // Truco iOS: forzar reflow del layout viewport tras cerrar el teclado.
      const prev = root.style.height;
      root.style.height = `${window.innerHeight}px`;
      void root.offsetHeight;
      root.style.height = prev;

      apply(0, false);
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!vv) {
          apply(0, false);
          return;
        }

        // Distancia entre el borde inferior del layout y el del visual viewport.
        const inset = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
        const open = inset >= KEYBOARD_OPEN_PX;

        if (open) {
          clearCloseTimers();
          apply(inset, true);

          const active = document.activeElement;
          if (
            active instanceof HTMLElement &&
            (active.tagName === "INPUT" ||
              active.tagName === "TEXTAREA" ||
              active.isContentEditable)
          ) {
            // Con overflow del documento bloqueado, iOS no scrollea solo.
            active.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
          }
          return;
        }

        apply(0, false);
      });
    };

    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (
        next instanceof HTMLElement &&
        (next.tagName === "INPUT" || next.tagName === "TEXTAREA" || next.isContentEditable)
      ) {
        return;
      }
      // El teclado anima ~300ms; recuperar en varios ticks.
      clearCloseTimers();
      closeTimers = [50, 280, 500, 800].map((ms) =>
        window.setTimeout(() => {
          sync();
          if (!root.hasAttribute("data-keyboard-open")) {
            recoverAfterKeyboard();
          }
        }, ms)
      );
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (
        !(target instanceof HTMLElement) ||
        (target.tagName !== "INPUT" &&
          target.tagName !== "TEXTAREA" &&
          !target.isContentEditable)
      ) {
        return;
      }
      window.setTimeout(() => {
        sync();
        target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      }, 50);
      window.setTimeout(sync, 300);
    };

    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("focusout", onFocusOut);
    window.addEventListener("orientationchange", sync);

    return () => {
      cancelAnimationFrame(frame);
      clearCloseTimers();
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("orientationchange", sync);
      root.style.removeProperty("--keyboard-inset");
      root.removeAttribute("data-keyboard-open");
    };
  }, []);

  return null;
}
