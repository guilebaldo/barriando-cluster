"use client";

import { useImmersiveScrollLock } from "@/app/components/useImmersiveScrollLock";

export default function PasaporteImmersiveShell({ children }: { children: React.ReactNode }) {
  useImmersiveScrollLock();

  return (
    <div className="map-immersive-shell fixed inset-0 z-0 flex flex-col bg-[#faf6ef] text-slate-900 font-sans antialiased overflow-hidden overscroll-none">
      {children}
    </div>
  );
}
