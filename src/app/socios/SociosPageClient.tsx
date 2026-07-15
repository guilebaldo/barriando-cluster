"use client";

import Navbar from "../components/Navbar";
import MapImmersiveShell from "../map/MapImmersiveShell";
import SociosImmersiveView from "./SociosImmersiveView";
import type { Socio } from "../data/socios";

export default function SociosPageClient({
  socios,
  canRedeemBenefits,
  initialBenefitsOnly = false,
  initialSocioId = null,
}: {
  socios: Socio[];
  canRedeemBenefits: boolean;
  initialBenefitsOnly?: boolean;
  initialSocioId?: number | null;
}) {
  return (
    <MapImmersiveShell>
      <Navbar />
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <SociosImmersiveView
          socios={socios}
          canRedeemBenefits={canRedeemBenefits}
          initialBenefitsOnly={initialBenefitsOnly}
          initialSocioId={initialSocioId}
        />
      </main>
    </MapImmersiveShell>
  );
}
