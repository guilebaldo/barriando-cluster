/** Pase de ciudad para visitantes del Centro Histórico. Modelo tipo CityPASS. */

export const BARRIOPASS_FEE_MXN = 10;
export const BARRIOPASS_MAX_TICKETS_PER_ORDER = 10;
export const BARRIOPASS_MAX_TICKETS_PER_USER = 10;
export const BARRIOPASS_VALIDITY_DAYS = 9;
export const BARRIOPASS_ACTIVATE_WITHIN_DAYS = 365;
export const BARRIOPASS_VENUE = "Centro Histórico de Puebla";
export const BARRIOPASS_LAT = 19.0409265;
export const BARRIOPASS_LNG = -98.1984453;

export type BarrioPassSku = "classic" | "c3";

export type BarrioPassAttraction = {
  id: string;
  name: string;
  kind: string;
  included: boolean;
  gateMxn: number;
  admission: string;
  blurb: string;
  logo: string | null;
  url: string | null;
  socio: boolean;
};

/**
 * 2 fijas (Amparo + Barroco) + 5 a elegir 3.
 * Precios de taquilla 2026: Amparo $85, Barroco $105, Palafoxiana / Alfeñique /
 * Revolución $50 (tarifario estatal). Furlong y Talavera: valor de referencia
 * de visita en socio del clúster.
 */
export const BARRIOPASS_ATTRACTIONS: BarrioPassAttraction[] = [
  {
    id: "amparo",
    name: "Museo Amparo",
    kind: "Museo",
    included: true,
    gateMxn: 85,
    admission: "Admisión general — colecciones permanente y temporales.",
    blurb:
      "Arte prehispánico, virreinal y contemporáneo en el antiguo Hospitalito. La parada que no te saltas.",
    logo: "amparo",
    url: "https://museoamparo.com",
    socio: true,
  },
  {
    id: "barroco",
    name: "Museo Internacional del Barroco",
    kind: "Museo",
    included: true,
    gateMxn: 105,
    admission: "Admisión general — recinto Toyo Ito y acervo barroco.",
    blurb:
      "El otro must. Arquitectura contemporánea y la colección barroca más ambiciosa de Puebla.",
    logo: null,
    url: "https://mib.puebla.gob.mx",
    socio: false,
  },
  {
    id: "palafoxiana",
    name: "Biblioteca Palafoxiana",
    kind: "Biblioteca",
    included: false,
    gateMxn: 50,
    admission: "Admisión general — primera biblioteca pública de América.",
    blurb: "Memoria del Mundo UNESCO. Estantería barroca original, 1646.",
    logo: null,
    url: null,
    socio: false,
  },
  {
    id: "furlong",
    name: "Casona Furlong",
    kind: "Museo",
    included: false,
    gateMxn: 80,
    admission: "Visita a la casa-museo — socio del clúster.",
    blurb: "Casona del centro con acervo y visitas de casa histórica.",
    logo: "furlong",
    url: "https://www.instagram.com/casonafurlong",
    socio: true,
  },
  {
    id: "alfenique",
    name: "Museo Casa de Alfeñique",
    kind: "Museo",
    included: false,
    gateMxn: 50,
    admission: "Admisión general — fachada de alfeñique y vida novohispana.",
    blurb: "El dulce de cal que le da nombre. Historia cotidiana del Puebla virreinal.",
    logo: null,
    url: null,
    socio: false,
  },
  {
    id: "revolucion",
    name: "Museo de la Revolución Mexicana",
    kind: "Museo",
    included: false,
    gateMxn: 50,
    admission: "Admisión general — Casa de los Hermanos Serdán.",
    blurb: "Donde empezó el levantamiento en Puebla. Una visita corta y densa.",
    logo: null,
    url: null,
    socio: false,
  },
  {
    id: "laluz",
    name: "Talavera de La Luz",
    kind: "Taller",
    included: false,
    gateMxn: 90,
    admission: "Visita al taller — proceso de talavera certificada.",
    blurb: "Ver el oficio, no solo la vitrina. Socio del clúster.",
    logo: "laluz",
    url: "https://www.talaveradelaluz.com",
    socio: true,
  },
];

export const BARRIOPASS_SKUS: Record<
  BarrioPassSku,
  {
    sku: BarrioPassSku;
    eventTitle: string;
    name: string;
    tagline: string;
    attractions: number;
    adultMxn: number;
    childMxn: number;
    saveUpToPct: number;
    faceMxn: number;
    bestseller: boolean;
  }
> = {
  classic: {
    sku: "classic",
    eventTitle: "BarrioPASS · 5 atracciones",
    name: "BarrioPASS",
    tagline: "Mejor valor · el más vendido",
    attractions: 5,
    adultMxn: 199,
    childMxn: 159,
    saveUpToPct: 46,
    /** Amparo + Barroco + Furlong + Palafoxiana + Alfeñique */
    faceMxn: 370,
    bestseller: true,
  },
  c3: {
    sku: "c3",
    eventTitle: "BarrioPASS C3 · 3 atracciones",
    name: "BarrioPASS C3",
    tagline: "Ideal para una estancia corta",
    attractions: 3,
    adultMxn: 139,
    childMxn: 109,
    saveUpToPct: 42,
    /** Amparo + Barroco + Palafoxiana — el trío de primerizo */
    faceMxn: 240,
    bestseller: false,
  },
};

export function isBarrioPassEventTitle(title: string): boolean {
  return title.startsWith("BarrioPASS");
}

export function formatMxn(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function barrioPassQuote(input: {
  sku: BarrioPassSku;
  adultQty: number;
  childQty: number;
}): {
  tickets: number;
  subtotal: number;
  fee: number;
  total: number;
  face: number;
  savings: number;
} {
  const product = BARRIOPASS_SKUS[input.sku];
  const adultQty = clampQty(input.adultQty);
  const childQty = clampQty(input.childQty);
  const tickets = adultQty + childQty;
  const subtotal = adultQty * product.adultMxn + childQty * product.childMxn;
  const fee = tickets * BARRIOPASS_FEE_MXN;
  const face = tickets * product.faceMxn;
  return {
    tickets,
    subtotal,
    fee,
    total: subtotal + fee,
    face,
    savings: Math.max(0, face - subtotal),
  };
}

export function clampQty(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(BARRIOPASS_MAX_TICKETS_PER_ORDER, Math.max(0, Math.floor(n)));
}

export function parseBarrioPassSku(raw: unknown): BarrioPassSku {
  return raw === "c3" ? "c3" : "classic";
}
