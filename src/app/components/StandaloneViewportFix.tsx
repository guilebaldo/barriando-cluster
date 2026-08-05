"use client";

import { useEffect } from "react";

const KEYBOARD_OPEN_PX = 100;

/**
 * iOS standalone + teclado:
 * - `--keyboard-inset`: sube fichas mientras se escribe
 * - `data-keyboard-open`: esconde el hub
 * - `--hub-gap-fix`: cuando iOS deja el layout viewport más bajo que
 *   antes del teclado, empuja el hub hacia abajo a tapar la franja
 */
export default function StandaloneViewportFix() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;

    let frame = 0;
    let closeTimers: number[] = [];
    let baselineHeight = Math.max(
      window.innerHeight,
      vv?.height ?? 0,
      root.clientHeight
    );

    const clearCloseTimers = () => {
      for (const id of closeTimers) window.clearTimeout(id);
      closeTimers = [];
    };

    const setGapFix = (px: number) => {
      root.style.setProperty("--hub-gap-fix", `${Math.max(0, Math.round(px))}px`);
    };

    const applyKeyboard = (inset: number, open: boolean) => {
      root.style.setProperty("--keyboard-inset", `${Math.max(0, Math.round(inset))}px`);
      if (open) root.setAttribute("data-keyboard-open", "");
      else root.removeAttribute("data-keyboard-open");
    };

    const recoverAfterKeyboard = () => {
      window.scrollTo(0, 0);
      if (document.body.scrollTop) document.body.scrollTop = 0;
      if (root.scrollTop) root.scrollTop = 0;

      const gap = Math.max(0, baselineHeight - window.innerHeight);
      setGapFix(gap);
      applyKeyboard(0, false);

      // Si el viewport se recupera un momento después, limpiar el fix.
      window.setTimeout(() => {
        if (window.innerHeight >= baselineHeight - 2) {
          baselineHeight = Math.max(baselineHeight, window.innerHeight);
          setGapFix(0);
        }
      }, 400);
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!vv) {
          applyKeyboard(0, false);
          setGapFix(0);
          return;
        }

        const inset = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
        const open = inset >= KEYBOARD_OPEN_PX;

        if (open) {
          clearCloseTimers();
          // No actualizar baseline con el alto reducido del teclado.
          setGapFix(0);
          applyKeyboard(inset, true);

          const active = document.activeElement;
          if (
            active instanceof HTMLElement &&
            (active.tagName === "INPUT" ||
              active.tagName === "TEXTAREA" ||
              active.isContentEditable)
          ) {
            active.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
          }
          return;
        }

        // Teclado cerrado: recordar el alto “sano” y medir si iOS lo dejó corto.
        if (window.innerHeight >= baselineHeight - 2) {
          baselineHeight = Math.max(baselineHeight, window.innerHeight);
          setGapFix(0);
        } else {
          setGapFix(baselineHeight - window.innerHeight);
        }
        applyKeyboard(0, false);
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
      clearCloseTimers();
      closeTimers = [80, 320, 600, 900].map((ms) =>
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
      // Capturar alto real justo antes de que el teclado encoja el viewport.
      if (!root.hasAttribute("data-keyboard-open")) {
        baselineHeight = Math.max(baselineHeight, window.innerHeight, vv?.height ?? 0);
      }
      window.setTimeout(() => {
        sync();
        target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      }, 50);
      window.setTimeout(sync, 300);
    };

    const onOrientation = () => {
      baselineHeight = Math.max(window.innerHeight, vv?.height ?? 0);
      setGapFix(0);
      sync();
    };

    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("focusout", onFocusOut);
    window.addEventListener("orientationchange", onOrientation);

    return () => {
      cancelAnimationFrame(frame);
      clearCloseTimers();
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("orientationchange", onOrientation);
      root.style.removeProperty("--keyboard-inset");
      root.style.removeProperty("--hub-gap-fix");
      root.removeAttribute("data-keyboard-open");
    };
  }, []);

  return null;
}
