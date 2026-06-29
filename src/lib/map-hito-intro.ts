const ZONE_INTROS: Record<number, string> = {
  1: "En el corazón del primer cuadrante histórico, este espacio guarda siglos de vida barrial, fe y arquitectura novohispana.",
  2: "El barrio de La Luz concentra tradiciones dulceras, talleres alfareros y callejones que narran el oficio poblano.",
  3: "Alrededor del Zócalo y la Catedral, el poder civil y religioso de Puebla se despliega en portales, palacios y murales.",
  4: "Analco y los Sapos mezclan antigüedad, comercio de antigüedades y la hospitalidad de los barrios del sur del centro.",
};

const HITO_INTROS: Record<string, string> = {
  "Teatro Principal":
    "Inaugurado en el siglo XIX, es uno de los teatros más antiguos de México y punto de partida ideal del recorrido MAP.",
  "Catedral":
    "Joyas barrocas y torres que dominan el perfil del Zócalo; símbolo máximo del patrimonio religioso poblano.",
  "Biblioteca Palafoxiana":
    "La primera biblioteca pública de América, fundada en 1646, conserva volúmenes únicos en un entorno de madera tallada.",
  "Zócalo":
    "Plaza Mayor de Puebla, escenario de festividades, música y la vida cotidiana del centro histórico.",
  "Callejón de los Sapos":
    "Famoso por antigüedades, arte y ambiente bohemio; uno de los rincones más fotografiados de la ciudad.",
};

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getHitoIntro(name: string, zone?: number): string {
  const exact = HITO_INTROS[name];
  if (exact) return exact;

  const normalized = normalizeName(name);
  for (const [key, intro] of Object.entries(HITO_INTROS)) {
    if (normalizeName(key) === normalized) return intro;
  }

  if (zone && ZONE_INTROS[zone]) {
    return `${name} forma parte de la zona ${zone} del MAP. ${ZONE_INTROS[zone]}`;
  }

  return `${name} es un hito patrimonial del Museo Abierto de Puebla (MAP), integrado al circuito peatonal del Centro Histórico.`;
}
