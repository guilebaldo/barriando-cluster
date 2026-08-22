"use client";

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
      <PasesMarketplace events={events} notice={notice} signedIn />
    </>
  );
}
