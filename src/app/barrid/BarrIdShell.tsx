"use client";

import { useEffect } from "react";

/** Shell inmersivo (como MAP/socios): sin scroll de página; ficha fija abajo. */
export default function BarrIdShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
    };

    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    return () => {
      html.style.overflow = previous.htmlOverflow;
      html.style.overscrollBehavior = previous.htmlOverscroll;
      body.style.overflow = previous.bodyOverflow;
      body.style.overscrollBehavior = previous.bodyOverscroll;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 flex flex-col overflow-hidden overscroll-none bg-slate-50 text-slate-900 font-sans antialiased">
      {children}
    </div>
  );
}
