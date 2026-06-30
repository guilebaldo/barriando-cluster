"use client";

import { SessionProvider } from "next-auth/react";
import SessionRefetchOnShow from "./SessionRefetchOnShow";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth" refetchOnWindowFocus>
      <SessionRefetchOnShow />
      {children}
    </SessionProvider>
  );
}
