"use client";

import { useMemo, useState } from "react";
import { Ticket, MapPin, ChevronLeft } from "lucide-react";
import {
  accessEventHasEnded,
  accessEventIsSoldOut,
  formatAccessPriceMxn,
  formatAccessWhen,
  type AccessEventCard,
} from "@/lib/access-events";
import { startAccessTicketCheckout } from "@/app/pases/actions";

export default function PasesMarketplace({
  events,
  notice,
  signedIn = true,
}: {
  events: AccessEventCard[];
  notice?: "ok" | "cancelado" | null;
  signedIn?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId]
  );

  async function buy(eventId: string) {
    if (!signedIn) {
      window.location.assign(`/login?callbackUrl=${encodeURIComponent("/pases")}`);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await startAccessTicketCheckout(eventId);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    window.location.assign(result.url);
  }

  return (
    <section className="w-full h-full min-h-0 flex flex-col">
      <div className="flex items-center gap-2 shrink-0 px-0.5">
        <Ticket className="w-5 h-5 text-amber-500" />
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-amber-700">Pases</h2>
      </div>

      {notice === "ok" ? (
        <p className="mt-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          Tu pase ya está en tu BarrID. Ábrelo para mostrar el QR en la entrada.
        </p>
      ) : null}
      {notice === "cancelado" ? (
        <p className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          No se completó el pago. Puedes intentarlo de nuevo.
        </p>
      ) : null}

      {selected ? (
        <EventDetail
          event={selected}
          busy={busy}
          error={error}
          onBack={() => {
            setSelectedId(null);
            setError(null);
          }}
          onBuy={() => void buy(selected.id)}
        />
      ) : (
        <CatalogList events={events} onOpen={setSelectedId} />
      )}
    </section>
  );
}

function CatalogList({
  events,
  onOpen,
}: {
  events: AccessEventCard[];
  onOpen: (id: string) => void;
}) {
  if (events.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center px-4">
        <Ticket className="w-10 h-10 text-amber-400 mb-3" />
        <p className="text-sm font-semibold text-[#27366D]">Aún no hay pases</p>
        <p className="mt-1 text-xs text-slate-500 font-light leading-relaxed max-w-[16rem]">
          Aquí aparecerán boletos y entradas a eventos del Centro Histórico.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-2 pr-0.5">
      {events.map((event) => {
        const ended = accessEventHasEnded(event.startsAt, event.endsAt);
        const soldOut = accessEventIsSoldOut(event.capacity, event.soldCount);
        return (
          <button
            key={event.id}
            type="button"
            onClick={() => onOpen(event.id)}
            className="w-full text-left rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm hover:border-amber-300/80 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#27366D] leading-snug truncate">
                  {event.title}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 truncate">
                  {formatAccessWhen(event.startsAt, event.endsAt)}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 truncate inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {event.venue}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold text-amber-700">
                  {formatAccessPriceMxn(event.priceCents)}
                </p>
                {ended ? (
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Finalizado
                  </p>
                ) : soldOut ? (
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Agotado
                  </p>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function EventDetail({
  event,
  busy,
  error,
  onBack,
  onBuy,
}: {
  event: AccessEventCard;
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onBuy: () => void;
}) {
  const ended = accessEventHasEnded(event.startsAt, event.endsAt);
  const soldOut = accessEventIsSoldOut(event.capacity, event.soldCount);
  const canBuy = !ended && !soldOut;

  return (
    <div className="mt-3 flex-1 min-h-0 overflow-y-auto overscroll-contain">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-[#27366D]"
      >
        <ChevronLeft className="w-4 h-4" />
        Pases
      </button>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Pase</p>
        <h3 className="mt-1 text-lg font-black font-serif-cluster uppercase tracking-wide text-[#27366D] leading-tight">
          {event.title}
        </h3>
        <p className="mt-2 text-xs text-slate-600">{formatAccessWhen(event.startsAt, event.endsAt)}</p>
        <p className="mt-1 text-xs text-slate-500 inline-flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {event.venue}
        </p>
        {event.description ? (
          <p className="mt-3 text-sm text-slate-600 font-light leading-relaxed">{event.description}</p>
        ) : null}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="font-bold text-amber-700">{formatAccessPriceMxn(event.priceCents)}</span>
          {event.capacity != null ? (
            <span className="text-slate-500">
              {event.soldCount}/{event.capacity} ocupados
            </span>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}

        {canBuy ? (
          <button
            type="button"
            disabled={busy}
            onClick={onBuy}
            className="mt-4 w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition"
          >
            {busy ? "Continuando…" : "Obtener pase"}
          </button>
        ) : (
          <p className="mt-4 text-xs text-slate-500">
            {ended ? "Este evento ya terminó." : "Ya no hay cupo."}
          </p>
        )}
      </div>
    </div>
  );
}
