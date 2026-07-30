"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import SessionRefetchOnShow from "./SessionRefetchOnShow";
import AppBottomNav from "./AppBottomNav";
import HubDebugOverlay from "./HubDebugOverlay";
import { ensureInstallPromptListener } from "@/lib/add-to-home-screen";

/**
 * `session` viene del layout (server): sin ella, useSession arranca en "loading"
 * y en cold start de la PWA el hub y los paddings se calculan como si no
 * hubiera sesión hasta que responde /api/auth/session.
 */
export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  useEffect(() => {
    ensureInstallPromptListener();
  }, []);

  return (
    <SessionProvider session={session} basePath="/api/auth" refetchOnWindowFocus>
      <SessionRefetchOnShow />
      {children}
      {/* Persistente: no remontar el hub en cada página (rompe anclaje en standalone). */}
      <AppBottomNav />
      <HubDebugOverlay />
    </SessionProvider>
  );
}
