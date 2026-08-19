"use client";

import { CalendarPlus, WalletCards } from "lucide-react";
import type { AccessTicketCard } from "@/lib/access-events";
import { googleCalendarUrl } from "@/lib/access-ticket-save";

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export default function TicketSaveButtons({ ticket }: { ticket: AccessTicketCard }) {
  function addToCalendar() {
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
    window.location.assign(`/api/pases/tickets/${ticket.id}/wallet`);
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={addToWallet}
        className="inline-flex items-center justify-center gap-1.5 border border-slate-200 bg-white text-[#27366D] hover:bg-slate-50 font-bold text-[11px] uppercase tracking-wider px-3 py-2.5 rounded-xl transition"
      >
        <WalletCards className="w-3.5 h-3.5" />
        Wallet
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
  );
}
