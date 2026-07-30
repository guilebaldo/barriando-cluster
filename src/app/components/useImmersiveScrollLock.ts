"use client";

import { useEffect } from "react";

/**
 * Evita scroll/rubber-band del documento detrás de shells immersive y Ajustes.
 * No usa position:fixed ni alto forzado en html/body (rompe el hub en standalone).
 *
 * También anula el padding del hub que globals.css le pone al body: aquí el
 * shell ya reserva --app-hub-offset por dentro, y sumar los dos dejaría el
 * documento más alto que la pantalla.
 *
 * `mobileOnly` para los shells que en escritorio vuelven a layout normal con
 * scroll y footer (BarrID, Planes).
 */
export function useImmersiveScrollLock({ mobileOnly = false } = {}) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const previous = {
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
      bodyPaddingBottom: body.style.paddingBottom,
    };

    let locked = false;

    const lock = () => {
      if (locked) return;
      locked = true;
      html.style.overflow = "hidden";
      html.style.overscrollBehavior = "none";
      body.style.overflow = "hidden";
      body.style.overscrollBehavior = "none";
      body.style.paddingBottom = "0px";
    };

    const unlock = () => {
      if (!locked) return;
      locked = false;
      html.style.overflow = previous.htmlOverflow;
      html.style.overscrollBehavior = previous.htmlOverscroll;
      body.style.overflow = previous.bodyOverflow;
      body.style.overscrollBehavior = previous.bodyOverscroll;
      body.style.paddingBottom = previous.bodyPaddingBottom;
    };

    if (!mobileOnly) {
      lock();
      return unlock;
    }

    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      if (mq.matches) lock();
      else unlock();
    };

    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      unlock();
    };
  }, [mobileOnly]);
}
