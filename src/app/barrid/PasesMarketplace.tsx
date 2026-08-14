"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Ticket, MapPin, ChevronLeft } from "lucide-react";
import {
  accessEventHasEnded,
  accessEventIsSoldOut,
  formatAccessPriceMxn,
  formatAccessWhen,
  type AccessEventCard,
  type AccessTicketCard,
} from "@/lib/access-events";
import {
  createAccessTicketCredential,
  startAccessTicketCheckout,
} from "@/app/pases/actions";

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function PasesMarketplace({
  events,
  tickets,
  notice,
}: {
  events: AccessEventCard[];
  tickets: AccessTicketCard[];
  notice?: "ok" | "cancelado" | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => {
    const fromCatalog = events.find((event) => event.id === selectedId) ?? null;
    if (fromCatalog) return fromCatalog;
    const fromTicket = tickets.find((ticket) => ticket.eventId === selectedId);
    if (!fromTicket || !selectedId) return null;
    return {
      id: selectedId,
      title: fromTicket.event.title,
      description: "",
      venue: fromTicket.event.venue,
      startsAt: fromTicket.event.startsAt,
      endsAt: fromTicket.event.endsAt,
      priceCents: 0,
      capacity: null,
      soldCount: 0,
      published: false,
    } satisfies AccessEventCard;
  }, [events, tickets, selectedId]);
  const ownedForSelected = useMemo(
    () => (selectedId ? tickets.filter((ticket) => ticket.eventId === selectedId) : []),
    [tickets, selectedId]
  );

  async function buy(eventId: string) {
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
          Tu pase ya está listo. Ábrelo para mostrar el QR en la entrada.
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
          owned={ownedForSelected}
          listed={events.some((event) => event.id === selected.id)}
          busy={busy}
          error={error}
          onBack={() => {
            setSelectedId(null);
            setError(null);
          }}
          onBuy={() => void buy(selected.id)}
        />
      ) : (
        <CatalogList events={events} tickets={tickets} onOpen={setSelectedId} />
      )}
    </section>
  );
}

function CatalogList({
  events,
  tickets,
  onOpen,
}: {
  events: AccessEventCard[];
  tickets: AccessTicketCard[];
  onOpen: (id: string) => void;
}) {
  const ownedByEvent = useMemo(() => {
    const map = new Map<string, number>();
    for (const ticket of tickets) {
      map.set(ticket.eventId, (map.get(ticket.eventId) ?? 0) + 1);
    }
    return map;
  }, [tickets]);

  if (events.length === 0 && tickets.length === 0) {
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
      {tickets.length > 0 ? (
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-0.5">
          Tus pases
        </p>
      ) : null}
      {tickets.map((ticket) => (
        <button
          key={ticket.id}
          type="button"
          onClick={() => onOpen(ticket.eventId)}
          className="w-full text-left rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3.5 shadow-sm hover:border-emerald-300 transition"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#27366D] leading-snug truncate">
                {ticket.event.title}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 truncate">
                {formatAccessWhen(ticket.event.startsAt, ticket.event.endsAt)}
              </p>
            </div>
            <p className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              {ticket.redeemedAt ? "Usado" : "Mostrar QR"}
            </p>
          </div>
        </button>
      ))}

      {events.length > 0 ? (
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-0.5 pt-2">
          Disponibles
        </p>
      ) : null}
      {events.map((event) => {
        const owned = ownedByEvent.get(event.id) ?? 0;
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
                {owned > 0 ? (
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Tu pase{owned > 1 ? ` · ${owned}` : ""}
                  </p>
                ) : ended ? (
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
  owned,
  listed,
  busy,
  error,
  onBack,
  onBuy,
}: {
  event: AccessEventCard;
  owned: AccessTicketCard[];
  listed: boolean;
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onBuy: () => void;
}) {
  const ended = accessEventHasEnded(event.startsAt, event.endsAt);
  const soldOut = accessEventIsSoldOut(event.capacity, event.soldCount);
  const canBuy = listed && !ended && !soldOut;

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
        {listed ? (
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="font-bold text-amber-700">{formatAccessPriceMxn(event.priceCents)}</span>
            {event.capacity != null ? (
              <span className="text-slate-500">
                {event.soldCount}/{event.capacity} ocupados
              </span>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}

        {canBuy ? (
          <button
            type="button"
            disabled={busy}
            onClick={onBuy}
            className="mt-4 w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition"
          >
            {busy ? "Continuando…" : owned.length > 0 ? "Comprar otro" : "Obtener pase"}
          </button>
        ) : listed ? (
          <p className="mt-4 text-xs text-slate-500">
            {ended ? "Este evento ya terminó." : "Ya no hay cupo."}
          </p>
        ) : null}
      </div>

      {owned.map((ticket) => (
        <TicketQrCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}

function TicketQrCard({ ticket }: { ticket: AccessTicketCard }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!ticket.redeemedAt);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (ticket.redeemedAt) {
      setLoading(false);
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const result = await createAccessTicketCredential(ticket.id);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      try {
        const url = await QRCode.toDataURL(result.verifyUrl, {
          width: 420,
          margin: 1,
          errorCorrectionLevel: "M",
        });
        if (cancelled) return;
        setQrDataUrl(url);
        setExpiresAtMs(Date.now() + result.expiresInSeconds * 1000);
        setSecondsLeft(result.expiresInSeconds);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("No se pudo dibujar el QR.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticket.id, ticket.redeemedAt, refreshKey]);

  useEffect(() => {
    if (!expiresAtMs) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAtMs]);

  useEffect(() => {
    if (!expiresAtMs || loading || secondsLeft > 0) return;
    setExpiresAtMs(null);
    setRefreshKey((key) => key + 1);
  }, [expiresAtMs, loading, secondsLeft]);

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Tu pase</p>
      {ticket.redeemedAt ? (
        <p className="mt-3 text-sm text-slate-500">Este pase ya fue usado en la entrada.</p>
      ) : (
        <>
          <div className="mt-3 mx-auto w-[min(56vw,14rem)] h-[min(56vw,14rem)] bg-white border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
            {loading && !qrDataUrl ? (
              <p className="text-xs text-slate-400">Generando…</p>
            ) : null}
            {error ? <p className="text-xs text-red-700 px-3">{error}</p> : null}
            {qrDataUrl && !error ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`QR de ${ticket.event.title}`}
                className={`w-full h-full object-contain p-2 ${loading ? "opacity-40" : "opacity-100"}`}
              />
            ) : null}
          </div>
          {expiresAtMs && !error ? (
            <p className="mt-2 text-xs font-semibold tabular-nums text-[#27366D]">
              Válido por {formatCountdown(secondsLeft)}
            </p>
          ) : null}
          <p className="mt-1 text-[11px] text-slate-500">Muéstralo en la entrada. Un solo uso.</p>
        </>
      )}
    </div>
  );
}
