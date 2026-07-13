"use client";

import { useEffect } from "react";

/**
 * Fullscreen + sin scroll de página en móvil.
 * Evita `position: fixed` en `body` (rompe la navegación al /panel y otras rutas).
 * El contenedor ya es `fixed inset-0`; solo se bloquea overflow.
 */
export default function BarrIdShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const mq = window.matchMedia("(max-width: 767px)");

    const previous = {
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
    };

    let locked = false;

    const lock = () => {
      if (locked) return;
      locked = true;
      html.style.overflow = "hidden";
      html.style.overscrollBehavior = "none";
      body.style.overflow = "hidden";
      body.style.overscrollBehavior = "none";
    };

    const unlock = () => {
      if (!locked) return;
      locked = false;
      html.style.overflow = previous.htmlOverflow;
      html.style.overscrollBehavior = previous.htmlOverscroll;
      body.style.overflow = previous.bodyOverflow;
      body.style.overscrollBehavior = previous.bodyOverscroll;
    };

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
  }, []);

  return (
    <div className="fixed inset-0 z-0 flex flex-col overflow-hidden overscroll-none bg-white text-slate-900 font-sans antialiased md:static md:inset-auto md:min-h-screen md:h-auto md:overflow-visible md:overscroll-auto">
      {children}
    </div>
  );
}
