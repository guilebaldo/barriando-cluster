"use client";

import Link from "next/link";
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
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black tracking-wide text-slate-950 font-sans">Pases</h1>
        <Link
          href="/pases/mios"
          className="text-[11px] font-bold uppercase tracking-wider text-[#27366D] hover:text-amber-600"
        >
          Mis pases
        </Link>
      </div>
      <PasesMarketplace events={events} notice={notice} signedIn />
    </>
  );
}
