"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Check, Clock, X } from "lucide-react";

export type PassportNotice = {
  type: "success" | "error" | "info";
  title: string;
  text: string;
};

const TONE = {
  success: {
    wrap: "bg-emerald-600 text-white shadow-[0_12px_40px_rgba(5,150,105,0.35)]",
    iconWrap: "bg-white/15 ring-1 ring-white/25",
    bar: "bg-white/80",
    Icon: Check,
  },
  error: {
    wrap: "bg-red-600 text-white shadow-[0_12px_40px_rgba(220,38,38,0.32)]",
    iconWrap: "bg-white/15 ring-1 ring-white/25",
    bar: "bg-white/80",
    Icon: AlertCircle,
  },
  info: {
    wrap: "bg-[#27366D] text-white shadow-[0_12px_40px_rgba(39,54,109,0.4)]",
    iconWrap: "bg-amber-400/20 ring-1 ring-amber-300/40 text-amber-300",
    bar: "bg-amber-400",
    Icon: Clock,
  },
} as const;

export default function PassportNoticeToast({
  notice,
  onClose,
}: {
  notice: PassportNotice;
  onClose: () => void;
}) {
  const tone = TONE[notice.type];
  const Icon = tone.Icon;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center px-3 pb-[max(0.85rem,calc(var(--app-hub-offset,0px)+0.55rem))] pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl animate-toast-up ${tone.wrap}`}
      >
        <div className="flex items-start gap-3 px-4 pt-3.5 pb-3.5">
          <span
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone.iconWrap}`}
          >
            <Icon className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1 pr-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
              {notice.title}
            </p>
            <p className="mt-1 text-sm font-medium leading-snug text-white/95">{notice.text}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2.5 top-2.5 rounded-full p-1 text-white/55 hover:text-white hover:bg-white/10 transition"
            aria-label="Cerrar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-[3px] bg-white/15">
          <div className={`h-full origin-left animate-toast-bar ${tone.bar}`} />
        </div>
      </div>
    </div>,
    document.body
  );
}
