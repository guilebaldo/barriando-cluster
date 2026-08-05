"use client";

import { useEffect } from "react";

const KEYBOARD_OPEN_PX = 100;

/**
 * iOS standalone: tras cerrar el teclado, `position: fixed; bottom: 0`
 * se queda calculado como si el teclado siguiera abierto → el hub flota.
 *
 * Solución: anclar el hub al borde inferior del visualViewport en cada
 * resize/scroll, y al blur forzar un reflow (display) + scrollTo(0,0).
 */
export default function StandaloneViewportFix() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;

    let frame = 0;
    let closeTimers: number[] = [];

    const nav = () =>
      document.querySelector<HTMLElement>(".app-bottom-nav");

    const clearCloseTimers = () => {
      for (const id of closeTimers) window.clearTimeout(id);
      closeTimers = [];
    };

    const clearNavPin = () => {
      const el = nav();
      if (!el) return;
      el.style.top = "";
      el.style.bottom = "";
      el.style.transform = "";
    };

    /** Pega el hub al fondo del visual viewport (coordenadas del layout). */
    const pinHub = () => {
      const el = nav();
      if (!el || !vv) return;

      if (root.hasAttribute("data-keyboard-open")) {
        // Lo esconde el CSS; no pelear con el transform.
        el.style.top = "";
        el.style.bottom = "";
        return;
      }

      const height = el.offsetHeight || Math.round(56 + (Number.parseFloat(
        getComputedStyle(root).getPropertyValue("--safe-area-inset-bottom")
      ) || 0));
      const top = Math.round(vv.offsetTop + vv.height - height);
      el.style.bottom = "auto";
      el.style.top = `${Math.max(0, top)}px`;
      el.style.transform = "";
    };

    const setKeyboardOpen = (open: boolean, inset = 0) => {
      root.style.setProperty("--keyboard-inset", `${Math.max(0, Math.round(inset))}px`);
      if (open) root.setAttribute("data-keyboard-open", "");
      else root.removeAttribute("data-keyboard-open");
    };

    /** WebKit a veces deja el fixed “congelado”; ocultar/mostrar lo despega. */
    const unstickHub = () => {
      const el = nav();
      window.scrollTo(0, 0);
      if (document.body.scrollTop) document.body.scrollTop = 0;
      if (root.scrollTop) root.scrollTop = 0;

      setKeyboardOpen(false, 0);

      if (el) {
        const prev = el.style.display;
        el.style.display = "none";
        void el.offsetHeight;
        el.style.display = prev;
      }

      // Dos frames: el viewport termina de asentarse.
      requestAnimationFrame(() => {
        pinHub();
        requestAnimationFrame(pinHub);
      });
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!vv) {
          setKeyboardOpen(false, 0);
          clearNavPin();
          return;
        }

        const inset = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
        const open = inset >= KEYBOARD_OPEN_PX;

        if (open) {
          clearCloseTimers();
          setKeyboardOpen(true, inset);

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

        setKeyboardOpen(false, 0);
        pinHub();
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
      // El teclado iOS anima ~300ms; despegar en varios ticks.
      closeTimers = [100, 350, 600, 1000].map((ms) =>
        window.setTimeout(() => {
          sync();
          if (!root.hasAttribute("data-keyboard-open")) {
            unstickHub();
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
    window.addEventListener("orientationchange", () => {
      clearNavPin();
      window.setTimeout(unstickHub, 100);
      window.setTimeout(sync, 300);
    });

    return () => {
      cancelAnimationFrame(frame);
      clearCloseTimers();
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
      clearNavPin();
      root.style.removeProperty("--keyboard-inset");
      root.style.removeProperty("--hub-gap-fix");
      root.removeAttribute("data-keyboard-open");
    };
  }, []);

  return null;
}
