import { isVisibleInCarousel } from "@/lib/plan-visibility";
import type { MembershipPlan } from "@/generated/prisma/client";

type StampLayoutItem = {
  id: number;
  membershipPlan?: MembershipPlan | string | null;
};

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j]!;
    arr[j] = tmp!;
  }
  return arr;
}

function isFeaturedPreviewPlan(plan: string | null | undefined): boolean {
  if (!plan) return false;
  return isVisibleInCarousel(plan as MembershipPlan);
}

/**
 * Coloca sellos Mediana + Gran Empresa repartidos a lo largo de filas/columnas
 * (posiciones espaciadas + shuffle estable) en la demo logout de /pasaporte.
 */
export function scatterFeaturedPassportStamps<T extends StampLayoutItem>(list: T[]): T[] {
  if (list.length === 0) return list;

  const featured = list.filter((r) => isFeaturedPreviewPlan(r.membershipPlan ?? null));
  const rest = list.filter((r) => !isFeaturedPreviewPlan(r.membershipPlan ?? null));
  if (featured.length === 0) return list;

  const n = list.length;
  const out: Array<T | null> = Array.from({ length: n }, () => null);

  // Índices base repartidos uniformemente por el grid (filas × columnas).
  const baseSlots: number[] = [];
  for (let i = 0; i < featured.length; i++) {
    baseSlots.push(Math.floor(((i + 0.5) * n) / featured.length) % n);
  }

  // Pequeño jitter estable por id para que no queden en una línea recta.
  const jittered = baseSlots.map((slot, i) => {
    const id = featured[i]?.id ?? i;
    const jitter = ((id * 17) % 5) - 2; // -2..+2
    return (((slot + jitter) % n) + n) % n;
  });

  const used = new Set<number>();
  const finalSlots: number[] = [];
  for (const slot of jittered) {
    let p = slot;
    let guard = 0;
    while (used.has(p) && guard < n) {
      p = (p + 1) % n;
      guard += 1;
    }
    used.add(p);
    finalSlots.push(p);
  }

  const featuredShuffled = seededShuffle(featured, 0x5e11);
  finalSlots.forEach((pos, i) => {
    out[pos] = featuredShuffled[i] ?? null;
  });

  const restShuffled = seededShuffle(rest, 0xc0ffee);
  let ri = 0;
  for (let i = 0; i < n; i++) {
    if (out[i] == null) {
      out[i] = restShuffled[ri++] ?? null;
    }
  }

  return out.filter((item): item is T => item != null);
}

export function getFeaturedPassportPreviewIds<T extends StampLayoutItem>(list: T[]): number[] {
  return list
    .filter((r) => isFeaturedPreviewPlan(r.membershipPlan ?? null))
    .map((r) => r.id)
    .sort((a, b) => a - b);
}
