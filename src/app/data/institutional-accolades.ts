export type InstitutionalAccolade = {
  id: string;
  title: string;
  description: string;
  verifyUrl: string;
  apaCitation: string;
  iconLabel: string;
};

export const INSTITUTIONAL_ACCOLADES: InstitutionalAccolade[] = [
  {
    id: "capital-cultura-2026",
    title: "Capital Americana de la Cultura (2026)",
    description:
      "Puebla declarada oficialmente como referente cultural del continente americano, impulsando el desarrollo y proyección global de su patrimonio vivo.",
    verifyUrl:
      "https://www.pueblacapital.gob.mx/noticias/capital-imparable/puebla-capital-americana-de-la-cultura-2026-pepe-chedraui-destaca-la-relevancia-de-la-designacion",
    apaCitation:
      "Honorable Ayuntamiento de Puebla. (2026). Puebla, Capital Americana de la Cultura 2026. Portal de Noticias del Gobierno Municipal.",
    iconLabel: "CAC",
  },
  {
    id: "tianguis-2027",
    title: "Sede del Tianguis Turístico México (2027)",
    description:
      "Elegida de forma unánime como la sede oficial de la edición 51 de la cumbre de negocios turísticos más importante del país.",
    verifyUrl:
      "https://www.gob.mx/sectur/articulos/puebla-toma-la-estafeta-del-tianguis-turístico-mexico-2027-se-formaliza-el-relevo-y-se-reconoce-a-lo-mejor-del-sector",
    apaCitation:
      "Secretaría de Turismo del Gobierno de México. (2026). Puebla toma la estafeta del Tianguis Turístico México 2027. Portal del Gobierno Federal.",
    iconLabel: "TTM",
  },
  {
    id: "michelin",
    title: "Guía Michelin (2024-2026)",
    description:
      "Mención y Selección Oficial en la Guía Michelin México — Posicionando restaurantes icónicos de la traza caminable con Estrellas y distinciones Bib Gourmand.",
    verifyUrl: "https://guide.michelin.com/mx/es/noticias-y-debates/la-guia-michelin-desbarca-oficialmente-en-mexico",
    apaCitation:
      "Michelin Travel Partner. (2024). Guía MICHELIN México: Una nueva selección que celebra la riqueza gastronómica. Guía MICHELIN Oficial.",
    iconLabel: "MIC",
  },
  {
    id: "capital-gastronomica",
    title: "Capital Iberoamericana de la Cultura Gastronómica (2023)",
    description:
      "Reconocimiento otorgado por la Academia Iberoamericana de Gastronomía gracias a la excelencia de su cocina tradicional y contemporánea.",
    verifyUrl:
      "https://www.puebla.gob.mx/index.php/noticias/item/22118-puebla-es-nominada-en-los-premios-food-and-travel-2025-reader-awards",
    apaCitation:
      "Academia Iberoamericana de Gastronomía. (2023). Puebla ostenta el título de Capital Iberoamericana de la Cultura Gastronómica 2023-2024. AIBG Global.",
    iconLabel: "AIBG",
  },
  {
    id: "conde-nast",
    title: "Condé Nast Traveler — Best Places to Go (2022)",
    description:
      "Seleccionada en la exclusiva lista global de los mejores destinos del mundo para viajar, destacando su vanguardia hotelera y riqueza artesanal.",
    verifyUrl: "https://www.cntraveler.com/story/best-places-to-go-in-2022",
    apaCitation:
      "Condé Nast Traveler Editorial. (2021). The 22 Best Places to Go in 2022. Condé Nast Global.",
    iconLabel: "CNT",
  },
  {
    id: "icca",
    title: "Turismo de Reuniones — Ranking ICCA",
    description:
      "Consolidada históricamente en el 4º lugar a nivel nacional como sede líder en la atracción de congresos, convenciones y ferias internacionales de negocios.",
    verifyUrl: "https://www.pueblacapital.gob.mx",
    apaCitation:
      "International Congress and Convention Association [ICCA]. (2020). ICCA Statistics Report: Mexico Country and City Rankings. ICCA Global Intelligence.",
    iconLabel: "ICCA",
  },
];
