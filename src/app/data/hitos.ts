export interface Hito {
  id: number;
  nombre: string;
  zona: number;
  socioId?: number;
}

/** Inventario MUAAP alineado con data/barriando-muaap-hitos.csv */
export const listaHitos: Hito[] = [
  { id: 1, nombre: "Teatro Principal", zona: 1 },
  { id: 2, nombre: "Mesón del Cristo", zona: 1 },
  { id: 3, nombre: "San Cristóbal", zona: 1 },
  { id: 4, nombre: "Santa Clara", zona: 1 },
  { id: 5, nombre: "La Victoria", zona: 1 },
  { id: 6, nombre: "Palacio Episcopal", zona: 1 },
  { id: 7, nombre: "Templo y Convento de San Francisco", zona: 1 },
  { id: 8, nombre: "Capilla de Dolores", zona: 1 },
  { id: 9, nombre: "Monumento a los fundadores de Puebla", zona: 1 },
  { id: 10, nombre: "Barrio de El Alto", zona: 1, socioId: 2 },
  { id: 11, nombre: "Casa Aguayo", zona: 1 },
  { id: 12, nombre: "Parroquia de la Santa Cruz", zona: 1 },
  { id: 13, nombre: "Capilla del Cirineo", zona: 1 },
  { id: 14, nombre: "Lavaderos de Almoloya", zona: 1 },
  { id: 15, nombre: "Fuente de los Leones", zona: 1 },
  { id: 16, nombre: "Ruinas San Francisco", zona: 1 },
  { id: 17, nombre: "Parque San Francisco", zona: 1 },
  { id: 18, nombre: "Centro de Convenciones", zona: 1 },
  { id: 19, nombre: "Museo Regional de la Revolución Mexicana", zona: 1 },

  { id: 20, nombre: "Calle de los Dulces", zona: 2 },
  { id: 21, nombre: "Templo de Nuestra Señora de La luz", zona: 2 },
  { id: 22, nombre: "Parador de La luz", zona: 2 },
  { id: 23, nombre: "La Acocota", zona: 2 },
  { id: 24, nombre: "CasaReyna", zona: 2 },
  { id: 25, nombre: "Fábrica de Vidrio", zona: 2 },
  { id: 26, nombre: "Talavera de La Luz", zona: 2, socioId: 14 },
  { id: 27, nombre: "Centro Alfarero del Barro de La Luz", zona: 2 },

  { id: 28, nombre: "Bello y Zetina", zona: 3 },
  { id: 29, nombre: "Santo Domingo", zona: 3 },
  { id: 30, nombre: "Portales", zona: 3 },
  { id: 31, nombre: "Palacio Municipal", zona: 3 },
  { id: 32, nombre: "Zócalo", zona: 3 },
  { id: 33, nombre: "Catedral", zona: 3 },
  { id: 34, nombre: "Casa de cultura", zona: 3 },
  { id: 35, nombre: "Biblioteca Palafoxiana", zona: 3 },
  { id: 36, nombre: "Museo Amparo", zona: 3, socioId: 3 },
  { id: 37, nombre: "Mural de los Poblanos", zona: 3 },

  { id: 38, nombre: "La Casa del Mendrugo", zona: 4, socioId: 16 },
  { id: 39, nombre: "Hotel Colonial", zona: 4, socioId: 9 },
  { id: 40, nombre: "La Compañía de Jesús", zona: 4 },
  { id: 41, nombre: "La Pasita", zona: 4 },
  { id: 42, nombre: "Restauro", zona: 4, socioId: 24 },
  { id: 43, nombre: "Callejón de los Sapos", zona: 4 },
  { id: 44, nombre: "Bazar Los Sapos", zona: 4 },
  { id: 45, nombre: "Salón Mezcalli", zona: 4, socioId: 17 },
  { id: 46, nombre: "Barrio de Analco", zona: 4 },
  { id: 47, nombre: "Tianguis Analco", zona: 4 },
  { id: 48, nombre: "Parroquia del Santo Angel Custodio", zona: 4 },
  { id: 49, nombre: "Puente de Bubas", zona: 4 },
];
