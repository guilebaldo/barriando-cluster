export type EquipoGrupo = "consejo" | "operacion" | "comunicacion";

export interface MiembroEquipo {
  id: number;
  slug: string;
  nombre: string;
  cargo: string;
  empresa?: string;
  descripcion: string;
  iniciales: string;
  grupo: EquipoGrupo;
}

export const EQUIPO_TOTAL = 8;

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const miembros: Omit<MiembroEquipo, "iniciales">[] = [
  {
    id: 1,
    slug: "alexander-gehrke",
    nombre: "Alexander Gehrke",
    cargo: "Presidente",
    empresa: "Hotel Cartesiano",
    descripcion:
      "Lidera la visión estratégica de Barriando y representa a la A.C. ante instancias públicas, privadas y académicas del sector turístico.",
    grupo: "consejo",
  },
  {
    id: 2,
    slug: "luis-vazquez-mota",
    nombre: "Luis Vázquez Mota",
    cargo: "Vicepresidente",
    empresa: "Comex",
    descripcion:
      "Fortalece la gobernanza del Clúster y articula alianzas estratégicas con actores clave del ecosistema turístico y empresarial.",
    grupo: "consejo",
  },
  {
    id: 3,
    slug: "juan-jose-cue",
    nombre: "Juan José Cué",
    cargo: "Secretario",
    empresa: "Mural de los Poblanos",
    descripcion:
      "Coordina la documentación institucional, las actas y el seguimiento de acuerdos del Consejo Directivo.",
    grupo: "consejo",
  },
  {
    id: 4,
    slug: "jose-ramon-lozano",
    nombre: "José Ramón Lozano",
    cargo: "Tesorero",
    empresa: "Casa del Mendrugo",
    descripcion:
      "Supervisa la administración financiera, la transparencia de recursos y el sustento económico de los proyectos del Clúster.",
    grupo: "consejo",
  },
  {
    id: 5,
    slug: "georgina-vigueras",
    nombre: "Georgina Vigueras",
    cargo: "Directora General / Clúster Manager",
    empresa: "Cosme Tortas",
    descripcion:
      "Coordina la operación institucional, la vinculación con socios y el desarrollo de productos turísticos para Puebla.",
    grupo: "operacion",
  },
  {
    id: 6,
    slug: "alan-bermudez",
    nombre: "Alan Bermúdez",
    cargo: "Director de Comunicación",
    descripcion:
      "Define la narrativa institucional, coordina relaciones públicas y posiciona a Barriando en medios y audiencias clave.",
    grupo: "comunicacion",
  },
  {
    id: 7,
    slug: "abril-cantu",
    nombre: "Abril Cantú",
    cargo: "Digital Content Manager",
    descripcion:
      "Produce y gestiona contenido digital que visibiliza eventos, socios, rutas y la cultura poblana en canales oficiales.",
    grupo: "comunicacion",
  },
  {
    id: 8,
    slug: "guilebaldo-ruiz",
    nombre: "Guilebaldo Ruiz",
    cargo: "Director de Tecnología e Innovación Digital",
    descripcion:
      "Impulsa la plataforma digital, herramientas para socios, innovación tecnológica y la presencia en línea del ecosistema Barriando.",
    grupo: "comunicacion",
  },
];

export const listaEquipo: MiembroEquipo[] = miembros.map((m) => ({
  ...m,
  iniciales: iniciales(m.nombre),
}));

export const GRUPO_EQUIPO_LABELS: Record<EquipoGrupo, string> = {
  consejo: "Consejo Directivo",
  operacion: "Dirección Operativa",
  comunicacion: "Comunicación, Contenido y Tecnología",
};
