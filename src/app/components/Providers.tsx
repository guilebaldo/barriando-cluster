"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import SessionRefetchOnShow from "./SessionRefetchOnShow";
import { ensureInstallPromptListener } from "@/lib/add-to-home-screen";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    ensureInstallPromptListener();
  }, []);

  return (
    <SessionProvider basePath="/api/auth" refetchOnWindowFocus>
      <SessionRefetchOnShow />
      {children}
    </SessionProvider>
  );
}
