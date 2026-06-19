export interface MiembroEquipo {
  id: number;
  nombre: string;
  cargo: string;
  descripcion: string;
  iniciales: string;
}

export const listaEquipo: MiembroEquipo[] = [
  {
    id: 1,
    nombre: "Por confirmar",
    cargo: "Presidente",
    descripcion: "Lidera la visión estratégica del Clúster y representa a la organización ante instancias públicas, privadas y académicas.",
    iniciales: "PR",
  },
  {
    id: 2,
    nombre: "Por confirmar",
    cargo: "Tesorero",
    descripcion: "Supervisa la administración financiera, la transparencia de recursos y el sustento económico de los proyectos del Clúster.",
    iniciales: "TE",
  },
  {
    id: 3,
    nombre: "Por confirmar",
    cargo: "Secretario",
    descripcion: "Coordina actas, comunicación interna y el cumplimiento de los acuerdos del Consejo Directivo.",
    iniciales: "SE",
  },
  {
    id: 4,
    nombre: "Por confirmar",
    cargo: "Secretario Técnico",
    descripcion: "Articula la operación de proyectos, convenios y la vinculación técnica con socios y aliados estratégicos.",
    iniciales: "ST",
  },
  {
    id: 5,
    nombre: "Por confirmar",
    cargo: "Vocal — Vinculación Empresarial",
    descripcion: "Fortalece la red de socios, impulsa alianzas comerciales y nuevas afiliaciones al ecosistema turístico.",
    iniciales: "VE",
  },
  {
    id: 6,
    nombre: "Por confirmar",
    cargo: "Vocal — Promoción y Comunicación",
    descripcion: "Difunde la propuesta de valor del Clúster, coordina campañas y posiciona a Puebla en mercados turísticos.",
    iniciales: "PC",
  },
  {
    id: 7,
    nombre: "Por confirmar",
    cargo: "Vocal — Patrimonio y Cultura",
    descripcion: "Vincula el patrimonio histórico, las artes y la identidad cultural con productos turísticos de alto valor.",
    iniciales: "CU",
  },
  {
    id: 8,
    nombre: "Por confirmar",
    cargo: "Vocal — Turismo de Reuniones y Negocios",
    descripcion: "Desarrolla oportunidades en turismo MICE, congresos, ferias y vinculación con el sector empresarial.",
    iniciales: "TN",
  },
  {
    id: 9,
    nombre: "Por confirmar",
    cargo: "Vocal — Innovación y Desarrollo",
    descripcion: "Integra nuevas tendencias, emprendimiento turístico y soluciones digitales al portafolio del Clúster.",
    iniciales: "IN",
  },
  {
    id: 10,
    nombre: "Por confirmar",
    cargo: "Vocal — Comunidad y Barrios",
    descripcion: "Conecta a los barrios tradicionales con la promoción turística y el desarrollo económico local inclusivo.",
    iniciales: "BA",
  },
];
