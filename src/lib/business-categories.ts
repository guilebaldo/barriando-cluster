/** Categorías oficiales para giro del negocio (alta manual y perfil). */
export const BUSINESS_CATEGORY_OPTIONS = [
  "Restaurante",
  "Museo",
  "Iglesia",
  "Hotel/Hostal",
  "Artesanías",
  "Café",
  "Tienda",
  "Educación",
  "Servicios",
  "Tours",
  "Arte",
  "Hospedaje",
  "Alimentos y Bebidas",
  "Bebidas",
  "Hospital",
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORY_OPTIONS)[number];
