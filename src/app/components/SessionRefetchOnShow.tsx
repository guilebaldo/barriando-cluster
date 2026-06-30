"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

/** Re-sync JWT session after bfcache restore (browser Back/Forward). */
export default function SessionRefetchOnShow() {
  const { update } = useSession();
  const router = useRouter();

  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        void update().then(() => router.refresh());
      }
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [update, router]);

  return null;
}
