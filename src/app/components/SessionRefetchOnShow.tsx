"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

/** Re-sync JWT session after bfcache restore (browser Back/Forward). */
export default function SessionRefetchOnShow() {
  const { update } = useSession();

  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        void update();
      }
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [update]);

  return null;
}
