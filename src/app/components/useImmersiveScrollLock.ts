"use client";

import { useEffect } from "react";
import { isStandaloneDisplay } from "@/lib/add-to-home-screen";

/**
 * Bloqueo de scroll para shells immersive (MAPA / Cuponera / Pasaporte).
 * Safari: position:fixed en body.
 * Standalone: solo overflow hidden — no fijar alto de html/body (eso rompe Ajustes).
 * El alto del shell lo marca CSS con --app-shell-height.
 */
export function useImmersiveScrollLock() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const standalone = isStandaloneDisplay();

    const previous = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyHeight: body.style.height,
      bodyOverscroll: body.style.overscrollBehavior,
    };

    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.width = "100%";

    if (!standalone) {
      html.style.height = "100%";
      body.style.height = "100%";
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
    }

    return () => {
      html.style.overflow = previous.htmlOverflow;
      html.style.height = previous.htmlHeight;
      html.style.overscrollBehavior = previous.htmlOverscroll;
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.left = previous.bodyLeft;
      body.style.right = previous.bodyRight;
      body.style.width = previous.bodyWidth;
      body.style.height = previous.bodyHeight;
      body.style.overscrollBehavior = previous.bodyOverscroll;
      if (!standalone) {
        window.scrollTo(0, scrollY);
      }
    };
  }, []);
}
