"use client";

import { useEffect, useState } from "react";
import { Home, Share, X } from "lucide-react";
import {
  clearDeferredInstallPrompt,
  ensureInstallPromptListener,
  getDeferredInstallPrompt,
  hasDismissedAddToHome,
  isIosDevice,
  isMobileViewport,
  isStandaloneDisplay,
  markAddToHomeDismissed,
} from "@/lib/add-to-home-screen";

type Props = {
  userId: string;
  eligible: boolean;
  /** Copy variant: BarrID membership vs first passport use. */
  purpose?: "barrid" | "pasaporte";
};

export default function AddToHomeScreenModal({
  userId,
  eligible,
  purpose = "barrid",
}: Props) {
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [canNativeInstall, setCanNativeInstall] = useState(false);

  useEffect(() => {
    ensureInstallPromptListener();
    if (!eligible || !userId) {
      setOpen(false);
      return;
    }

    const evaluate = () => {
      if (!isMobileViewport() || isStandaloneDisplay() || hasDismissedAddToHome(userId)) {
        setOpen(false);
        return;
      }
      setIos(isIosDevice());
      setCanNativeInstall(Boolean(getDeferredInstallPrompt()));
      setOpen(true);
    };

    evaluate();
    const t = window.setTimeout(evaluate, 800);
    const mq = window.matchMedia("(max-width: 767px)");
    mq.addEventListener("change", evaluate);
    return () => {
      window.clearTimeout(t);
      mq.removeEventListener("change", evaluate);
    };
  }, [eligible, userId]);

  function dismiss() {
    markAddToHomeDismissed(userId);
    setOpen(false);
  }

  async function handleInstall() {
    const promptEvent = getDeferredInstallPrompt();
    if (!promptEvent) return;
    setInstalling(true);
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      clearDeferredInstallPrompt();
      dismiss();
    } catch {
      setInstalling(false);
    }
  }

  if (!open) return null;

  const blurb =
    purpose === "pasaporte" ? (
      <>
        Guarda el acceso directo para abrir tu Pasaporte como una app. El marcador se guardará
        como <span className="font-semibold text-[#27366D]">BarriApp</span>.
      </>
    ) : (
      <>
        Instala el acceso directo para abrir tu BarrID como una app. El marcador se guardará como{" "}
        <span className="font-semibold text-[#27366D]">BarriApp</span>.
      </>
    );

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/45 backdrop-blur-[2px] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="a2hs-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-popup-in">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#27366D]/10 text-[#27366D] mb-4">
          <Home className="w-5 h-5" />
        </span>

        <h2 id="a2hs-title" className="text-lg font-bold text-[#27366D] pr-8">
          Agrega BarriApp a tu inicio
        </h2>
        <p className="text-sm text-slate-600 font-light leading-relaxed mt-2">{blurb}</p>

        {ios ? (
          <ol className="mt-5 space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <span className="leading-snug">
                Toca <Share className="inline w-4 h-4 text-[#27366D] align-text-bottom" aria-hidden />{" "}
                <strong>Compartir</strong> en Safari.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <span className="leading-snug">
                Elige <strong>Agregar a pantalla de inicio</strong>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <span className="leading-snug">
                Confirma el nombre <strong>BarriApp</strong> y toca Agregar.
              </span>
            </li>
          </ol>
        ) : null}

        <div className="flex flex-col gap-2 mt-6">
          {!ios && canNativeInstall ? (
            <button
              type="button"
              onClick={() => void handleInstall()}
              disabled={installing}
              className="w-full bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition active:scale-[0.98] disabled:opacity-60"
            >
              {installing ? "Abriendo…" : "Agregar a inicio"}
            </button>
          ) : null}
          {!ios && !canNativeInstall ? (
            <p className="text-xs text-slate-500 leading-relaxed mb-1">
              En el menú del navegador elige <strong>Instalar app</strong> o{" "}
              <strong>Agregar a pantalla de inicio</strong>.
            </p>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="w-full text-slate-500 hover:text-slate-700 text-xs font-semibold py-2 transition"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
