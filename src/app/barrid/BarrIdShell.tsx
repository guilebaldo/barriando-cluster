"use client";

import { useEffect } from "react";
import AppHubShell from "@/app/components/AppHubShell";

/**
 * Móvil: chrome navy del hub + contenido.
 * Escritorio: flujo normal con scroll y footer.
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
    <AppHubShell
      title="BarrID"
      shellClassName="barrid-shell"
      contentClassName="bg-slate-50"
      desktopStatic
    >
      {children}
    </AppHubShell>
  );
}
