"use client";

import { useMemo, useState } from "react";
import {
  Ticket,
  MapPin,
  ChevronLeft,
  ChevronRight,
  List,
  CalendarDays,
} from "lucide-react";
import {
  accessEventHasEnded,
  accessEventIsSoldOut,
  formatAccessPriceMxn,
  formatAccessWhen,
  type AccessEventCard,
} from "@/lib/access-events";
import { startAccessTicketCheckout } from "@/app/pases/actions";

type CatalogView = "lista" | "calendario";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"] as const;

function localDayKey(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sortEventsChronological(events: AccessEventCard[]): AccessEventCard[] {
  const upcoming: AccessEventCard[] = [];
  const past: AccessEventCard[] = [];
  for (const event of events) {
    if (accessEventHasEnded(event.startsAt, event.endsAt)) past.push(event);
    else upcoming.push(event);
  }
  upcoming.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  past.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  return [...upcoming, ...past];
}

export default function PasesMarketplace({
  events,
  notice,
  signedIn = true,
}: {
  events: AccessEventCard[];
  notice?: "ok" | "cancelado" | null;
  signedIn?: boolean;
}) {
  const [view, setView] = useState<CatalogView>("lista");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chronological = useMemo(() => sortEventsChronological(events), [events]);

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
      {notice === "ok" ? (
        <p className="mb-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          Tu pase ya está listo. Ábrelo en Mis pases para mostrar el QR.
        </p>
      ) : null}
      {notice === "cancelado" ? (
        <p className="mb-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
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
        <>
          <ViewToggle view={view} onChange={setView} />
          {view === "lista" ? (
            <CatalogList events={chronological} onOpen={setSelectedId} />
          ) : (
            <CalendarView events={chronological} onOpen={setSelectedId} />
          )}
        </>
      )}
    </section>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: CatalogView;
  onChange: (next: CatalogView) => void;
}) {
  return (
    <div
      className="shrink-0 inline-flex self-start rounded-lg border border-slate-200 bg-white p-0.5"
      role="tablist"
      aria-label="Vista de pases"
    >
      <button
        type="button"
        role="tab"
        aria-selected={view === "lista"}
        onClick={() => onChange("lista")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
          view === "lista"
            ? "bg-[#27366D] text-white"
            : "text-slate-500 hover:text-[#27366D]"
        }`}
      >
        <List className="w-3.5 h-3.5" />
        Lista
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "calendario"}
        onClick={() => onChange("calendario")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
          view === "calendario"
            ? "bg-[#27366D] text-white"
            : "text-slate-500 hover:text-[#27366D]"
        }`}
      >
        <CalendarDays className="w-3.5 h-3.5" />
        Calendario
      </button>
    </div>
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
    return <EmptyCatalog />;
  }

  return (
    <div className="mt-3 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-2 pr-0.5">
      {events.map((event) => (
        <EventRow key={event.id} event={event} onOpen={onOpen} />
      ))}
    </div>
  );
}

function EmptyCatalog() {
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center px-4 py-10">
      <Ticket className="w-10 h-10 text-amber-400 mb-3" />
      <p className="text-sm font-semibold text-[#27366D]">Aún no hay pases</p>
      <p className="mt-1 text-xs text-slate-500 font-light leading-relaxed max-w-[16rem]">
        Aquí aparecerán boletos y entradas a eventos del Centro Histórico.
      </p>
    </div>
  );
}

function EventRow({
  event,
  onOpen,
}: {
  event: AccessEventCard;
  onOpen: (id: string) => void;
}) {
  const ended = accessEventHasEnded(event.startsAt, event.endsAt);
  const soldOut = accessEventIsSoldOut(event.capacity, event.soldCount);
  return (
    <button
      type="button"
      onClick={() => onOpen(event.id)}
      className="w-full text-left rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm hover:border-amber-300/80 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#27366D] leading-snug truncate">{event.title}</p>
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            {formatAccessWhen(event.startsAt, event.endsAt)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 truncate inline-flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {event.venue}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-bold text-amber-700">{formatAccessPriceMxn(event.priceCents)}</p>
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
}

function CalendarView({
  events,
  onOpen,
}: {
  events: AccessEventCard[];
  onOpen: (id: string) => void;
}) {
  const todayKey = localDayKey(new Date());
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(todayKey);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, AccessEventCard[]>();
    for (const event of events) {
      const key = localDayKey(event.startsAt);
      const list = map.get(key);
      if (list) list.push(event);
      else map.set(key, [event]);
    }
    return map;
  }, [events]);

  const monthLabel = useMemo(
    () =>
      new Date(cursor.year, cursor.month, 1).toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric",
      }),
    [cursor.year, cursor.month]
  );

  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const mondayIndex = (first.getDay() + 6) % 7;
    const total = Math.ceil((mondayIndex + daysInMonth) / 7) * 7;
    const out: Array<{ key: string | null; day: number | null }> = [];
    for (let i = 0; i < total; i++) {
      const dayNum = i - mondayIndex + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        out.push({ key: null, day: null });
        continue;
      }
      const key = localDayKey(new Date(cursor.year, cursor.month, dayNum));
      out.push({ key, day: dayNum });
    }
    return out;
  }, [cursor.year, cursor.month]);

  const dayEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  if (events.length === 0) {
    return <EmptyCatalog />;
  }

  return (
    <div className="mt-3 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pr-0.5">
      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-2 px-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#27366D]"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p className="text-sm font-semibold text-[#27366D] capitalize font-sans">{monthLabel}</p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#27366D]"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((label, i) => (
            <span
              key={`${label}-${i}`}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1"
            >
              {label}
            </span>
          ))}
          {cells.map((cell, i) => {
            if (!cell.key || cell.day == null) {
              return <span key={`empty-${i}`} className="aspect-square" />;
            }
            const count = eventsByDay.get(cell.key)?.length ?? 0;
            const isSelected = selectedDay === cell.key;
            const isToday = cell.key === todayKey;
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDay(cell.key)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition ${
                  isSelected
                    ? "bg-[#27366D] text-white"
                    : isToday
                      ? "bg-amber-50 text-[#27366D] font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{cell.day}</span>
                {count > 0 ? (
                  <span
                    className={`mt-0.5 h-1 w-1 rounded-full ${
                      isSelected ? "bg-amber-300" : "bg-amber-500"
                    }`}
                  />
                ) : (
                  <span className="mt-0.5 h-1 w-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay ? (
        dayEvents.length > 0 ? (
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <EventRow key={event.id} event={event} onOpen={onOpen} />
            ))}
          </div>
        ) : (
          <p className="text-center text-xs text-slate-500 py-4">No hay pases este día.</p>
        )
      ) : null}
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
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-[#27366D]"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Pase</p>
        <h3 className="mt-1 text-lg font-black uppercase tracking-wide text-[#27366D] leading-tight font-sans">
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
