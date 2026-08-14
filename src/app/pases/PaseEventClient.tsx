"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import {
  accessEventHasEnded,
  accessEventIsSoldOut,
  formatAccessPriceMxn,
  formatAccessWhen,
  type AccessEventCard,
} from "@/lib/access-events";
import { startAccessTicketCheckout } from "@/app/pases/actions";
import ShareAccessEventButton from "./ShareAccessEventButton";

export default function PaseEventClient({
  event,
  signedIn,
}: {
  event: AccessEventCard;
  signedIn: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ended = accessEventHasEnded(event.startsAt, event.endsAt);
  const soldOut = accessEventIsSoldOut(event.capacity, event.soldCount);
  const canBuy = !ended && !soldOut;

  async function buy() {
    if (!signedIn) {
      window.location.assign(
        `/login?callbackUrl=${encodeURIComponent(`/pases/${event.id}`)}`
      );
      return;
    }
    setBusy(true);
    setError(null);
    const result = await startAccessTicketCheckout(event.id);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    window.location.assign(result.url);
  }

  return (
    <div>
      <Link
        href="/pases"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#27366D] hover:text-amber-600"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Todos los pases
      </Link>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Pase</p>
        <h1 className="mt-1 text-2xl font-black uppercase tracking-wide text-[#27366D] leading-tight font-sans">
          {event.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{formatAccessWhen(event.startsAt, event.endsAt)}</p>
        <p className="mt-1 text-sm text-slate-500 inline-flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          {event.venue}
        </p>
        {event.description ? (
          <p className="mt-4 text-sm text-slate-600 font-light leading-relaxed">{event.description}</p>
        ) : null}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-bold text-amber-700">{formatAccessPriceMxn(event.priceCents)}</span>
          {event.capacity != null ? (
            <span className="text-slate-500 text-xs">
              {event.soldCount}/{event.capacity} ocupados
            </span>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}

        <div className="mt-5 space-y-2">
          {canBuy ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void buy()}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition"
            >
              {busy ? "Continuando…" : "Obtener pase"}
            </button>
          ) : (
            <p className="text-xs text-slate-500">
              {ended ? "Este evento ya terminó." : "Ya no hay cupo."}
            </p>
          )}
          <ShareAccessEventButton event={event} />
        </div>
      </div>
    </div>
  );
}
