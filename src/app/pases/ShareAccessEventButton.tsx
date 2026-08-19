"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import {
  accessEventPublicPath,
  formatAccessWhen,
  type AccessEventCard,
} from "@/lib/access-events";

export default function ShareAccessEventButton({
  event,
  compact = false,
  className = "",
}: {
  event: AccessEventCard;
  compact?: boolean;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied">("idle");

  async function onShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${accessEventPublicPath(event.id)}`;
    const when = formatAccessWhen(event.startsAt, event.endsAt);
    const byline = event.hostName?.trim() ? ` por ${event.hostName.trim()}` : "";
    const text = `${event.title}${byline} · ${when} · ${event.venue}`;

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: event.title, text, url });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch {
      // Sin clipboard ni share: nada que hacer.
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={(e) => void onShare(e)}
        aria-label={status === "copied" ? "Enlace copiado" : "Compartir pase"}
        title={status === "copied" ? "Enlace copiado" : "Compartir"}
        className={`inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700 transition ${className}`}
      >
        {status === "copied" ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => void onShare(e)}
      className={`inline-flex w-full items-center justify-center gap-2 border border-[#27366D]/20 text-[#27366D] font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl hover:bg-slate-50 transition ${className}`}
    >
      {status === "copied" ? (
        <>
          <Check className="w-4 h-4 text-emerald-600" />
          Enlace copiado
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Compartir
        </>
      )}
    </button>
  );
}
