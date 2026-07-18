"use client";

import { useEffect } from "react";
import { bind, play, type SoundName } from "cuelume";

/** Wire declarative data-cuelume-* attributes once the admin UI mounts. */
export function useAdminCuelume() {
  useEffect(() => {
    bind();
  }, []);
}

export function playCuelume(name: SoundName) {
  play(name);
}
