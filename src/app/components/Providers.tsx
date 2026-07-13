"use client";

import { SessionProvider } from "next-auth/react";
import SessionRefetchOnShow from "./SessionRefetchOnShow";
import ChunkLoadRecovery from "./ChunkLoadRecovery";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth" refetchOnWindowFocus>
      <SessionRefetchOnShow />
      <ChunkLoadRecovery />
      {children}
    </SessionProvider>
  );
}
