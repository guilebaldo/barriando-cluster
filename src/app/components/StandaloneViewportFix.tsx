"use client";

import { useEffect } from "react";

/**
 * iOS standalone / Safari: al cerrar el teclado nativo a veces queda
 * visualViewport.offsetTop > 0 (o un scroll residual), y el hub fixed
 * se queda flotando con un hueco blanco bajo él.
 *
 * Compensa con --vv-offset-top y resetea el scroll al cerrar el teclado.
 */
export default function StandaloneViewportFix() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    if (!vv) return;

    let frame = 0;

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const offsetTop = Math.max(0, vv.offsetTop || 0);
        // Si el visual viewport ya cubre casi toda la ventana, el teclado
        // cerró: forzar 0 aunque iOS deje un offset residual un frame más.
        const keyboardLikelyClosed = vv.height >= window.innerHeight * 0.9;
        const effectiveOffset = keyboardLikelyClosed ? 0 : offsetTop;
        root.style.setProperty("--vv-offset-top", `${effectiveOffset}px`);

        if (keyboardLikelyClosed) {
          if (window.scrollY !== 0) window.scrollTo(0, 0);
          if (document.body.scrollTop) document.body.scrollTop = 0;
          if (root.scrollTop) root.scrollTop = 0;
        }
      });
    };

    const onFocusOut = () => {
      // Tras blur del input, iOS anima el teclado ~250–350ms.
      window.setTimeout(sync, 50);
      window.setTimeout(sync, 300);
      window.setTimeout(sync, 500);
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    window.addEventListener("focusout", onFocusOut);
    window.addEventListener("orientationchange", sync);

    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      window.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("orientationchange", sync);
      root.style.removeProperty("--vv-offset-top");
    };
  }, []);

  return null;
}
