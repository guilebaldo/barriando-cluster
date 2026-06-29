export interface Destacado {
  id: string;
  activo: boolean;
  etiqueta: string;
  titulo: string;
  descripcion: string;
  detalle?: string;
  colaboracion?: string;
  href: string;
  cta: string;
  urgente?: boolean;
}

/** Actualización destacada en la landing — editar aquí para cambiar el banner principal. */
export const destacadoActual: Destacado = {
  id: "documenta-gastronomia-2026",
  activo: false,
  etiqueta: "Convocatoria abierta",
  titulo: "Barriando documenta la gastronomía poblana",
  descripcion:
    "Serie exclusiva de microdocumentales verticales para redes sociales. Buscamos 5 restaurantes con historia, identidad y pasión poblana.",
  colaboracion: "Barriando en colaboración con Alquimia y Molkgt",
  detalle: "⚠️ Solo 5 restaurantes seleccionados para esta edición",
  href: "/documenta",
  cta: "Ver convocatoria y postularme",
  urgente: true,
};
