"use client";

import { useState } from "react";
import { CalendarPlus, WalletCards } from "lucide-react";
import type { AccessTicketCard } from "@/lib/access-events";
import { googleCalendarUrl } from "@/lib/access-ticket-save";

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export default function TicketSaveButtons({
  ticket,
  walletReady,
}: {
  ticket: AccessTicketCard;
  walletReady: boolean;
}) {
  const [walletMsg, setWalletMsg] = useState<string | null>(null);

  function addToCalendar() {
    setWalletMsg(null);
    if (isAndroid()) {
      window.open(
        googleCalendarUrl(ticket.event, `${window.location.origin}/pases/mios`),
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
    window.location.assign(`/api/pases/tickets/${ticket.id}/calendar`);
  }

  function addToWallet() {
    setWalletMsg(null);
    if (isIOS() && !walletReady) {
      setWalletMsg(
        "Passbook requiere certificados de Apple en el servidor. Por ahora usa Calendario."
      );
      return;
    }
    window.location.assign(`/api/pases/tickets/${ticket.id}/wallet`);
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={addToWallet}
          className="inline-flex items-center justify-center gap-1.5 border border-slate-200 bg-white text-[#27366D] hover:bg-slate-50 font-bold text-[11px] uppercase tracking-wider px-3 py-2.5 rounded-xl transition"
        >
          <WalletCards className="w-3.5 h-3.5" />
          Passbook
        </button>
        <button
          type="button"
          onClick={addToCalendar}
          className="inline-flex items-center justify-center gap-1.5 border border-slate-200 bg-white text-[#27366D] hover:bg-slate-50 font-bold text-[11px] uppercase tracking-wider px-3 py-2.5 rounded-xl transition"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          Calendario
        </button>
      </div>
      {walletMsg ? (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-snug">
          {walletMsg}
        </p>
      ) : null}
    </div>
  );
}
