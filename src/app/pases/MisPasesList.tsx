"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Ticket } from "lucide-react";
import { createAccessTicketCredential } from "@/app/pases/actions";
import { formatAccessWhen, type AccessTicketCard } from "@/lib/access-events";

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function MisPasesList({ tickets }: { tickets: AccessTicketCard[] }) {
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

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
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
