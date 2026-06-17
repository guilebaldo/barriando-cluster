export interface Hito {
    id: number;
    nombre: string;
    zona: number;
    socioId?: number; // Opcional: ID del socio si el hito es un negocio afiliado
  }
  
  export const listaHitos: Hito[] = [
    // ZONA 1: El Origen y los Barrios de Fundación (1 a 19)
    { id: 1, nombre: "Teatro Principal", zona: 1 },
    { id: 2, nombre: "Mesón del Cristo", zona: 1 },
    { id: 3, nombre: "San Cristóbal", zona: 1 },
    { id: 4, nombre: "Santa Clara", zona: 1 },
    { id: 5, nombre: "Hermanos Serdán", zona: 1 },
    { id: 6, nombre: "La Victoria", zona: 1 },
    { id: 7, nombre: "Correos de México", zona: 1 },
    { id: 8, nombre: "Templo y convento Franciscano", zona: 1 },
    { id: 9, nombre: "Capilla de Dolores", zona: 1 },
    { id: 10, nombre: "Monumento a los fundadores de Puebla", zona: 1 },
    { id: 11, nombre: "Barrio de El Alto", zona: 1, socioId: 2 },
    { id: 12, nombre: "Casa Aguayo", zona: 1 },
    { id: 13, nombre: "Parroquia de la Santa Cruz", zona: 1 },
    { id: 14, nombre: "Capilla del Cirineo", zona: 1 },
    { id: 15, nombre: "Lavaderos de Almoloya", zona: 1 },
    { id: 16, nombre: "Fuente de los Leones", zona: 1 },
    { id: 17, nombre: "Ruinas San Francisco", zona: 1 },
    { id: 18, nombre: "Parque San Francisco", zona: 1 },
    { id: 19, nombre: "Centro de Convenciones", zona: 1 },
  
    // ZONA 2: Oficios, Sabores y Tradición (20 a 27)
    { id: 20, nombre: "Calle de los dulces", zona: 2 },
    { id: 21, nombre: "Templo de nuestra señora de la luz", zona: 2 },
    { id: 22, nombre: "Parador de la luz", zona: 2 },
    { id: 23, nombre: "La Acocota", zona: 2 },
    { id: 24, nombre: "CasaReyna", zona: 2 },
    { id: 25, nombre: "Fábrica de Vidrio", zona: 2 },
    { id: 26, nombre: "Talavera de La Luz", zona: 2, socioId: 14 },
    { id: 27, nombre: "Taller de Barro", zona: 2 },
  
    // ZONA 3: El Eje Monumental (28 a 38)
    { id: 28, nombre: "Andador 5 de mayo", zona: 3 },
    { id: 29, nombre: "Bello y Zetina", zona: 3 },
    { id: 30, nombre: "Santo Domingo", zona: 3 },
    { id: 31, nombre: "Portales", zona: 3 },
    { id: 32, nombre: "Reforma", zona: 3 },
    { id: 33, nombre: "Zócalo", zona: 3 },
    { id: 34, nombre: "Catedral", zona: 3 },
    { id: 35, nombre: "Fin andador 16 de septiembre", zona: 3 },
    { id: 36, nombre: "Casa de cultura", zona: 3 },
    { id: 37, nombre: "Biblioteca Palafoxiana", zona: 3 },
    { id: 38, nombre: "Museo Amparo", zona: 3, socioId: 3 },
  
    // ZONA 4: Del Teatro Histórico a los Callejones del Arte (39 a 50)
    { id: 39, nombre: "La Casa del Mendrugo", zona: 4, socioId: 16 },
    { id: 40, nombre: "Hotel Colonial", zona: 4, socioId: 9 },
    { id: 41, nombre: "Jesuitas la compañía", zona: 4 },
    { id: 42, nombre: "La pasita", zona: 4 },
    { id: 43, nombre: "Restauro", zona: 4, socioId: 24 },
    { id: 44, nombre: "Callejón de los sapos", zona: 4 },
    { id: 45, nombre: "Bazar los sapos", zona: 4 },
    { id: 46, nombre: "Salón Mezcalli", zona: 4, socioId: 17 },
    { id: 47, nombre: "Analco", zona: 4 },
    { id: 48, nombre: "Tianguis Analco", zona: 4 },
    { id: 49, nombre: "Parroquia del Santo Angel Custodio", zona: 4 },
    { id: 50, nombre: "Puente de Bubas", zona: 4 }
  ];