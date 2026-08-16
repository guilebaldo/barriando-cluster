"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import QRCode from "qrcode";
import { Ticket } from "lucide-react";
import { createAccessTicketCredential } from "@/app/pases/actions";
import { formatAccessWhen, type AccessTicketCard } from "@/lib/access-events";

const SWIPE_OFFSET = 72;
const SWIPE_VELOCITY = 450;

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

/**
 * Mis pases: con máx. 2 boletos, el swipe horizontal (como planes) encaja bien —
 * un QR grande por tarjeta y deslizar entre ellos.
 */
export default function MisPasesList({ tickets }: { tickets: AccessTicketCard[] }) {
  const [[page, direction], setPage] = useState([0, 0]);
  const ticketsKey = tickets.map((t) => t.id).join(",");

  useEffect(() => {
    setPage([0, 0]);
  }, [ticketsKey]);

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4">
        <Ticket className="w-10 h-10 text-amber-400 mb-3" />
        <p className="text-sm font-semibold text-[#27366D] font-sans">Aún no tienes pases</p>
        <p className="mt-1 text-xs text-slate-500 font-light leading-relaxed max-w-[16rem]">
          Cuando compres un boleto, su QR de entrada aparecerá aquí.
        </p>
      </div>
    );
  }

  const index = wrapIndex(page, tickets.length);
  const active = tickets[index];

  function paginate(dir: number) {
    if (tickets.length <= 1) return;
    setPage(([p]) => [p + dir, dir]);
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (tickets.length <= 1) return;
    const { offset, velocity } = info;
    if (offset.x < -SWIPE_OFFSET || velocity.x < -SWIPE_VELOCITY) {
      paginate(1);
      return;
    }
    if (offset.x > SWIPE_OFFSET || velocity.x > SWIPE_VELOCITY) {
      paginate(-1);
    }
  }

  if (!active) return null;

  return (
    <div className="flex flex-col">
      <div className="relative mx-auto w-full max-w-[340px] min-h-[22rem]">
        {tickets.length > 1 ? (
          <div
            aria-hidden
            className="absolute inset-x-3 top-4 bottom-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm scale-[0.97] opacity-45 pointer-events-none"
          />
        ) : null}

        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={active.id}
            custom={direction}
            variants={{
              enter: (dir: number) => ({
                x: dir === 0 ? 0 : dir > 0 ? 220 : -220,
                opacity: dir === 0 ? 1 : 0.35,
                scale: dir === 0 ? 1 : 0.96,
              }),
              center: { x: 0, opacity: 1, scale: 1 },
              exit: (dir: number) => ({
                x: dir < 0 ? 220 : -220,
                opacity: 0,
                scale: 0.96,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            drag={tickets.length > 1 ? "x" : false}
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.85}
            onDragEnd={onDragEnd}
            className="relative z-10 w-full cursor-grab active:cursor-grabbing"
            style={{ touchAction: "pan-x" }}
          >
            <TicketQrCard ticket={active} />
          </motion.div>
        </AnimatePresence>
      </div>

      {tickets.length > 1 ? (
        <div className="mt-3 flex flex-col items-center gap-1.5">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label="Pases">
              {tickets.map((ticket, i) => (
                <button
                  key={ticket.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Ver pase ${i + 1} de ${tickets.length}`}
                  onClick={() => setPage([i, i > index ? 1 : i < index ? -1 : 0])}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-[#27366D]" : "w-1.5 bg-slate-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-400 tabular-nums">
              {index + 1} / {tickets.length}
            </p>
          </div>
          <p className="text-[11px] text-slate-400">Desliza para ver el otro pase</p>
        </div>
      ) : null}
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center select-none">
      <p className="text-sm font-semibold text-[#27366D] leading-snug font-sans">{ticket.event.title}</p>
      <p className="mt-1 text-[11px] text-slate-500">
        {formatAccessWhen(ticket.event.startsAt, ticket.event.endsAt)} · {ticket.event.venue}
      </p>
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
                draggable={false}
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
