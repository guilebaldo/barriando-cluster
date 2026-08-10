/**
 * Textos cortos del circuito MAPA.
 * Basados en fuentes institucionales (UNESCO Memory of the World, SIC/Secretaría
 * de Cultura, Museos Puebla, Arquidiócesis, INBA, sitios oficiales de museos).
 */

const ZONE_INTROS: Record<number, string> = {
  1: "Zona del primer asentamiento franciscano y del barrio de El Alto: conventos, lavaderos y memoria fundacional junto al antiguo río San Francisco.",
  2: "Barrio de La Luz: tradición alfarera, talavera y oficios dulceros que aún animan talleres y calles del oriente del centro histórico.",
  3: "Primer cuadro frente al Zócalo: Catedral, Palacio Municipal, Palafoxiana y el eje civil-religioso declarado Patrimonio de la Humanidad (UNESCO, 1987).",
  4: "Analco y Los Sapos: barrio indígena histórico, antigüedades, tianguis y el cruce del antiguo río hacia el sur del centro.",
};

const HITO_INTROS: Record<string, string> = {
  // —— Zona 1 ——
  "Teatro Principal":
    "Recinto teatral activo más antiguo de México: el Ayuntamiento construyó el Coliseo en 1759 e inauguró en 1760–61; tras el incendio de 1902 se reabrió en 1940 (INBA / SIC Cultura).",
  "Mesón del Cristo":
    "Antigua posada del camino a San Francisco; casona del centro histórico vinculada al tránsito de viajeros hacia el barrio de El Alto.",
  "San Cristóbal":
    "Templo del Barrio del Alto dedicado a San Cristóbal; parte del entramado parroquial que acompañó el crecimiento de este arrabal histórico.",
  "Santa Clara":
    "Exconvento de clarisas (s. XVII) en la 6 Oriente; de su portería tomó nombre la calle donde floreció la tradición de dulces típicos poblanos.",
  "La Victoria":
    "Histórico mercado y hoy centro comercial junto al Zócalo norte; durante décadas fue el gran abasto del centro angelopolitano.",
  "Palacio Episcopal":
    "Antigua sede episcopal junto a la Catedral; hoy alberga oficinas postales y permanece como hito del poder eclesiástico colonial.",
  "Templo y Convento de San Francisco":
    "Primer convento de Puebla (asiento definitivo desde 1535). Fachada churrigueresca de ladrillo y azulejo; guarda los restos del beato Sebastián de Aparicio (SIC Cultura).",
  "Capilla de Dolores":
    "Capilla barrial del Alto dedicada a Nuestra Señora de los Dolores; pequeña pieza del paisaje devocional del primer cuadrante.",
  "Monumento a los fundadores de Puebla":
    "Conjunto escultórico que evoca la fundación de 1531 y la leyenda de los ángeles que trazaron la ciudad en el valle de Cuetlaxcoapan.",
  "Barrio de El Alto":
    "Arrabal histórico junto al convento de San Francisco; cuna de oficios, ferias y la identidad popular del oriente del centro.",
  "Casa Aguayo":
    "Casona del Barrio del Alto (s. XVI–XVII); desde 2020 es, junto con el Palacio de Gobierno, sede oficial del Poder Ejecutivo del Estado de Puebla.",
  "Parroquia de la Santa Cruz":
    "Parroquia del Alto dedicada a la Santa Cruz; ancla religiosa del barrio frente al antiguo cauce del río San Francisco.",
  "Capilla del Cirineo":
    "Capilla dedicada a Simón de Cirene en el Alto; parada de la tradición procesional y de la vida parroquial del barrio.",
  "Lavaderos de Almoloya":
    "Lavaderos públicos junto al antiguo río San Francisco/Almoloya, documentados desde el s. XVIII y reconstruidos en 1863; patrimonio del oficio de las lavanderas (SIC Cultura).",
  "Fuente de los Leones":
    "Fuente monumental del entorno de San Francisco / El Alto; hito urbano del paseo y la memoria hídrica del primer cuadrante.",
  "Ruinas San Francisco":
    "Vestigios del conjunto conventual franciscano integrados al Paseo San Francisco; testimonio material de la fundación de la ciudad.",
  "Parque San Francisco":
    "Paseo San Francisco: espacio público sobre el antiguo cauce del río, con restos conventuales, jardines y el Centro de Convenciones.",
  "Centro de Convenciones":
    "Centro de Convenciones Puebla, en el Paseo San Francisco; sede moderna de eventos junto a las ruinas del convento franciscano.",
  "Museo Regional de la Revolución Mexicana":
    "Casa de los Hermanos Serdán (6 Oriente 206). Aquí, el 18 de noviembre de 1910, se libró el primer combate de la Revolución; museo desde 1960 (Museos Puebla / Cultura).",

  // —— Zona 2 ——
  "Calle de los Dulces":
    "Tramo de la 6 Oriente (antes Portería de Santa Clara) donde, desde el s. XIX, se concentran dulcerías de camotes, tortitas y dulces típicos de tradición conventual.",
  "Templo de Nuestra Señora de La luz":
    "Templo titular del barrio de La Luz (Xichititlán); parroquia que dio nombre al barrio alfarero al oriente del centro.",
  "La Acocota":
    "Barrio de La Acocota, arrabal histórico del oriente poblano ligado a oficios y a la vida cotidiana fuera del primer cuadro.",
  "Fábrica de Vidrio":
    "Fábrica de Vidrio La Luz (fundada en 1935): taller-museo de vidrio verde prensado y soplado, oficio casi único en México (SIC Cultura).",
  "Centro Alfarero del Barro de La Luz":
    "Centro de formación y difusión de la alfarería del Barrio de La Luz, barrio reconocido por su tradición de barro y talavera.",
  "Talavera de La Luz":
    "Taller y tradición de talavera del Barrio de La Luz; oficio protegido como Denominación de Origen de la cerámica poblana.",

  // —— Zona 3 ——
  "Bello y Zetina":
    "Museo José Luis Bello y González / Bello y Zetina: colección privada convertida en museo público (1944) con arte de América, Europa y Asia en la casa original (Museos Puebla).",
  "Santo Domingo":
    "Templo de Santo Domingo y Capilla del Rosario (inaugurada 1690): cumbre del barroco novohispano, llamada «Casa de Oro» y joya del oro y el estuco poblano (SIC Cultura).",
  "Portales":
    "Portales del Zócalo —soportales históricos de la Plaza Mayor— donde se concentran cafés, comercio y la vida cotidiana frente a Catedral y Palacio Municipal.",
  "Palacio Municipal":
    "Sede del Ayuntamiento desde la traza de 1536; el edificio actual (estilo isabelino/neoclásico, arq. Charles Hall) se inauguró en 1906 frente al Zócalo.",
  "Zócalo":
    "Plaza Mayor del Centro Histórico de Puebla (Patrimonio Mundial UNESCO, 1987): escenario cívico, festivo y peatonal frente a la Catedral.",
  "Catedral":
    "Catedral Basílica: obras desde 1575 (Francisco Becerra), consagrada por Palafox en 1649; torres de unos 70 m que dominan el perfil del Zócalo (Arquidiócesis / INAH).",
  "Casa de cultura":
    "Casa de la Cultura Pedro Ángel Palou, en el Ex Colegio de San Juan (s. XVI); comparte manzana con la Biblioteca Palafoxiana y concentra exposiciones, cine y foros (Secretaría de Cultura).",
  "Biblioteca Palafoxiana":
    "Fundada en 1646 por el obispo Juan de Palafox y Mendoza; primera biblioteca pública de América. Memoria del Mundo UNESCO (2005); más de 40 mil volúmenes en estantería barroca original.",
  "Museo Amparo":
    "Inaugurado en 1991 por la Fundación Amparo en memoria de Amparo Rugarcía; colección de arte prehispánico, virreinal y contemporáneo en el antiguo Hospitalito (museoamparo.com).",
  "Mural de los Poblanos":
    "Murales y relato visual de la identidad poblana en el centro histórico; parada cultural del circuito peatonal del primer cuadro.",

  // —— Zona 4 ——
  "La Compañía de Jesús":
    "Templo del Espíritu Santo (La Compañía): fundado por jesuitas llegados en 1578; parte del Colegio del Espíritu Santo, germen de la actual BUAP. Conserva la tumba de Catalina de San Juan, la China Poblana.",
  "La Pasita":
    "Licorería fundada en 1916 por Emilio Contreras (antes El Gallo de Oro), frente a Los Sapos. Famosa por el licor de uva pasa servido con queso y pasa (tradición poblana viva).",
  "Callejón de los Sapos":
    "Calle empedrada cuyo nombre evoca las inundaciones del río San Francisco; hoy corredor de antigüedades, galerías y vida nocturna del sur del centro.",
  "Bazar Los Sapos":
    "Tianguis de antigüedades y curiosidades (consolidado desde los años 70) en la plazuela y calles de Los Sapos; cita de coleccionistas los fines de semana.",
  "Barrio de Analco":
    "Barrio de origen indígena (náhuatl «al otro lado del agua»), asentado desde 1531 al otro lado del río San Francisco; alfarería, panadería y tianguis dominical.",
  "Tianguis Analco":
    "Tianguis tradicional del Barrio de Analco: mercado popular de fin de semana con comida, antigüedades y oficio barrial.",
  "Parroquia del Santo Angel Custodio":
    "Parroquia del Santo Ángel Custodio de Analco; templo-barrio que articula la plaza y la vida religiosa del arrabal indígena histórico.",
  "Puente de Bubas":
    "Puente del s. XVII sobre el río San Francisco/Almoloya que llevaba al Hospital de las Bubas; rescatado y abierto al público en 2014; monumento INAH (centrohistorico.pueblacapital.gob.mx).",
  "Hotel Colonial":
    "Hotel histórico del centro, en casona colonial; hospedaje tradicional a pasos de Los Sapos y la Compañía de Jesús.",
  "La Casa del Mendrugo":
    "Casa-restaurante en casona del centro histórico; referente gastronómico y patrimonial del circuito de Analco–Los Sapos.",
  "Restauro":
    "Espacio gastronómico en inmueble restaurado del centro; ejemplo de reuso contemporáneo del patrimonio edificado.",
  "Salón Mezcalli":
    "Salón de mezcal y cultura del agave en el centro histórico; parada sensorial del circuito MAPA en la zona de Analco.",
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
    return `${name} forma parte de la zona ${zone} del MAPA. ${ZONE_INTROS[zone]}`;
  }

  return `${name} es un hito patrimonial del Museo Abierto de Puebla y Alrededores (MAPA), integrado al circuito peatonal del Centro Histórico.`;
}
