export interface MiembroEquipo {
  id: number;
  nombre: string;
  cargo: string;
  descripcion: string;
  iniciales: string;
  grupo: "direccion" | "operacion";
}

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
    nombre: "Alex Gehrke",
    cargo: "Presidente",
    descripcion:
      "Lidera la visión estratégica de Barriando y representa a la A.C. ante instancias públicas, privadas y académicas del sector turístico.",
    grupo: "direccion",
  },
  {
    id: 2,
    nombre: "Georgina Vigueras",
    cargo: "Directora",
    descripcion:
      "Coordina la operación institucional, la vinculación con socios y el desarrollo de productos turísticos para Puebla.",
    grupo: "direccion",
  },
  {
    id: 3,
    nombre: "José Ramón Lozano-Torres",
    cargo: "Tesorero",
    descripcion:
      "Supervisa la administración financiera, la transparencia de recursos y el sustento económico de los proyectos del Clúster.",
    grupo: "direccion",
  },
  {
    id: 4,
    nombre: "Alan Bermúdez",
    cargo: "Director de Comunicación",
    descripcion:
      "Define la narrativa institucional, coordina relaciones públicas y posiciona a Barriando en medios y audiencias clave.",
    grupo: "operacion",
  },
  {
    id: 5,
    nombre: "Abril Cantú",
    cargo: "Digital Content Manager",
    descripcion:
      "Produce y gestiona contenido digital que visibiliza eventos, socios, rutas y la cultura poblana en canales oficiales.",
    grupo: "operacion",
  },
  {
    id: 6,
    nombre: "Guilebaldo Ruiz",
    cargo: "Director de Tecnología e Innovación Digital",
    descripcion:
      "Impulsa la plataforma digital, herramientas para socios, innovación tecnológica y la presencia en línea del ecosistema Barriando.",
    grupo: "operacion",
  },
];

export const listaEquipo: MiembroEquipo[] = miembros.map((m) => ({
  ...m,
  iniciales: iniciales(m.nombre),
}));
