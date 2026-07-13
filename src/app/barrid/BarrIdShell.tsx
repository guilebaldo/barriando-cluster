"use client";

import { useEffect } from "react";

/** Fullscreen + scroll lock en móvil; flujo normal en desktop. */
export default function BarrIdShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const mq = window.matchMedia("(max-width: 767px)");

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

    let scrollY = 0;
    let locked = false;

    const lock = () => {
      if (locked) return;
      locked = true;
      scrollY = window.scrollY;
      html.style.height = "100%";
      html.style.overflow = "hidden";
      html.style.overscrollBehavior = "none";
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.height = "100%";
      body.style.overflow = "hidden";
      body.style.overscrollBehavior = "none";
    };

    const unlock = () => {
      if (!locked) return;
      locked = false;
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
      window.scrollTo(0, scrollY);
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
