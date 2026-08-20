"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import {
  accessEventDetailPlace,
  accessEventHasEnded,
  accessEventHasMapPin,
  accessEventIsSoldOut,
  formatAccessGoingLabel,
  formatAccessHostByline,
  formatAccessPriceMxn,
  formatAccessWhen,
  type AccessEventCard,
} from "@/lib/access-events";
import { startAccessTicketCheckout } from "@/app/pases/actions";
import ShareAccessEventButton from "./ShareAccessEventButton";
import AccessEventMiniMap from "./AccessEventMiniMap";
import AccessEventDateBadge from "./AccessEventDateBadge";
import AccessEventDescription from "./AccessEventDescription";

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
  const byline = formatAccessHostByline(event.hostName);
  const going = formatAccessGoingLabel(event.soldCount, {
    ended,
    capacity: event.capacity,
  });
  const place = accessEventDetailPlace(event);
  const showMap = accessEventHasMapPin(event);

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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Pase</p>
            <h1 className="mt-1 text-2xl font-black uppercase tracking-wide text-[#27366D] leading-tight font-sans">
              {event.title}
            </h1>
            {byline ? <p className="mt-1 text-sm text-slate-500">{byline}</p> : null}
          </div>
          <AccessEventDateBadge startsAt={event.startsAt} />
        </div>

        <p className="mt-3 text-sm text-slate-600">
          {formatAccessWhen(event.startsAt, event.endsAt, { style: "long" })}
        </p>
        {place.name ? (
          <p className="mt-1 text-sm font-medium text-slate-700 inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4 shrink-0 text-slate-500" />
            {place.name}
          </p>
        ) : null}
        {place.detail ? (
          <p
            className={`text-sm text-slate-500 ${
              place.name ? "mt-0.5 pl-6" : "mt-1 inline-flex items-center gap-1.5"
            }`}
          >
            {!place.name ? <MapPin className="w-4 h-4 shrink-0" /> : null}
            {place.detail}
          </p>
        ) : null}

        {showMap ? (
          <AccessEventMiniMap
            venue={event.venue}
            latitude={event.latitude}
            longitude={event.longitude}
            mapsUrl={event.mapsUrl}
            className="mt-4"
          />
        ) : null}

        {event.description ? (
          <AccessEventDescription html={event.description} className="mt-4" />
        ) : null}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-bold text-amber-700">{formatAccessPriceMxn(event.priceCents)}</span>
          {going ? <span className="text-slate-500 text-xs">{going}</span> : null}
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
