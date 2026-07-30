"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { isAdminUser } from "@/lib/admin";

const HIDE_KEY = "hubdebug:hidden";
const PROBE_ID = "safe-area-probe";
const SAMPLES_MS = [0, 60, 150, 300, 600, 1000, 3000];
const MAX_SAMPLES = 24;

type Sample = {
  label: string;
  t: number;
  standalone: boolean;
  shellClass: boolean;
  hubOffset: string;
  safeBottom: number;
  innerH: number;
  clientH: number;
  vvH: number;
  hubTop: number | null;
  hubH: number | null;
  shellH: number | null;
  shellPad: string | null;
};

function px(value: number | null): string {
  return value == null ? "-" : String(Math.round(value));
}

function takeSample(label: string): Sample {
  const root = document.documentElement;
  const hub = document.querySelector(".app-bottom-nav");
  const shell = document.querySelector(
    ".map-immersive-shell,.barrid-shell,.panel-mobile-shell,.planes-mobile-shell"
  );
  const probe = document.getElementById(PROBE_ID);
  const hubRect = hub?.getBoundingClientRect() ?? null;

  return {
    label,
    t: Math.round(performance.now()),
    standalone: window.matchMedia("(display-mode: standalone)").matches,
    shellClass: root.classList.contains("app-mobile-shell"),
    hubOffset: getComputedStyle(root).getPropertyValue("--app-hub-offset").trim(),
    safeBottom: probe ? probe.getBoundingClientRect().height : -1,
    innerH: window.innerHeight,
    clientH: root.clientHeight,
    vvH: Math.round(window.visualViewport?.height ?? -1),
    hubTop: hubRect ? hubRect.top : null,
    hubH: hubRect ? hubRect.height : null,
    shellH: shell ? shell.getBoundingClientRect().height : null,
    shellPad: shell ? getComputedStyle(shell).paddingBottom : null,
  };
}

/**
 * Instrumentación del cold start del hub en standalone (iOS).
 * Solo para la cuenta admin: en standalone no hay barra de direcciones, así que
 * no sirve un flag por query param. "Ocultar" vive en sessionStorage para que
 * cada arranque en frío —el caso que estamos midiendo— vuelva a mostrarlo.
 */
export default function HubDebugOverlay() {
  const { data: session } = useSession();
  const isAdmin = isAdminUser({
    email: session?.user?.email,
    role: session?.user?.role,
  });
  const [hidden, setHidden] = useState(false);
  const [samples, setSamples] = useState<Sample[]>([]);
  const enabled = isAdmin && !hidden;

  useEffect(() => {
    setHidden(sessionStorage.getItem(HIDE_KEY) === "1");
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const push = (label: string) =>
      setSamples((prev) =>
        prev.length >= MAX_SAMPLES ? prev : [...prev, takeSample(label)]
      );

    const timers = SAMPLES_MS.map((ms) =>
      window.setTimeout(() => push(`t+${ms}`), ms)
    );
    const raf = requestAnimationFrame(() => push("raf"));

    const onResize = () => push("resize");
    const onOrientation = () => push("orient");
    const onPageShow = () => push("pageshow");
    const onVvResize = () => push("vv:resize");

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);
    window.addEventListener("pageshow", onPageShow);
    window.visualViewport?.addEventListener("resize", onVvResize);

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
      window.removeEventListener("pageshow", onPageShow);
      window.visualViewport?.removeEventListener("resize", onVvResize);
    };
  }, [enabled]);

  const copy = useCallback(() => {
    void navigator.clipboard?.writeText(JSON.stringify(samples, null, 2));
  }, [samples]);

  const hide = useCallback(() => {
    sessionStorage.setItem(HIDE_KEY, "1");
    setHidden(true);
  }, []);

  if (!enabled) return null;

  const head = samples[0];

  return (
    <>
      <div
        id={PROBE_ID}
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          bottom: 0,
          width: 1,
          height: "env(safe-area-inset-bottom, 0px)",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
      <div className="fixed top-0 left-0 z-[999] max-h-[70vh] w-[96vw] overflow-y-auto bg-black/85 p-1.5 font-mono text-[9px] leading-[1.25] text-lime-300">
        <div className="flex gap-2 pb-1">
          <button type="button" onClick={copy} className="underline">
            copiar
          </button>
          <button type="button" onClick={hide} className="underline">
            ocultar
          </button>
          <span className="text-slate-400">
            {head
              ? `standalone=${head.standalone ? 1 : 0} cls=${head.shellClass ? 1 : 0}`
              : "…"}
          </span>
        </div>
        {samples.map((s, i) => (
          <div key={`${s.label}-${i}`} className="break-all pb-0.5">
            {s.label} {s.t}ms off={s.hubOffset || "-"} sab={px(s.safeBottom)} iH=
            {s.innerH} cH={s.clientH} vv={s.vvH} hub={px(s.hubTop)}/{px(s.hubH)} sh=
            {px(s.shellH)} pad={s.shellPad ?? "-"}
          </div>
        ))}
      </div>
    </>
  );
}
