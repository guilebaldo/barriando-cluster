"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";
import AddToHomeScreenModal from "@/app/barrid/AddToHomeScreenModal";
import PasesMarketplace from "@/app/barrid/PasesMarketplace";
import type { AccessEventCard } from "@/lib/access-events";

export default function PasesSignedInHome({
  events,
  notice,
  userId,
  isFirstLoginUser = false,
}: {
  events: AccessEventCard[];
  notice?: "ok" | "cancelado" | null;
  userId: string;
  isFirstLoginUser?: boolean;
}) {
  return (
    <>
      <AddToHomeScreenModal userId={userId} eligible={isFirstLoginUser} />
      <div className="mb-4 flex justify-end">
        <Link
          href="/pases/mios"
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#27366D] bg-[#27366D] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-[#27366D]/20 hover:bg-[#1e2b58] hover:border-[#1e2b58] transition active:scale-[0.98]"
        >
          <Ticket className="w-4 h-4" />
          Mis pases
        </Link>
      </div>
      <PasesMarketplace events={events} notice={notice} signedIn />
    </>
  );
}
