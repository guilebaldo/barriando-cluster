export type ParadeLang = "es" | "en";

export const PARADE_CONTACT_EMAIL = "clusterturistico.pue@gmail.com";

export type ParadeCta = {
  id: "band" | "sponsor" | "join";
  label: string;
  subject: string;
};

export type ParadeLocaleCopy = {
  metaTitle: string;
  metaDescription: string;
  brand: string;
  eventName: string;
  dateRule: string;
  heroMission: string;
  langLabel: string;
  ctaPrimary: string;
  sections: {
    vision: { title: string; body: string };
    whyPuebla: { title: string; body: string };
    usaBridge: { title: string; body: string };
    parade: { title: string; body: string };
    projection: {
      title: string;
      intro: string;
      goals: { label: string; detail: string }[];
    };
    cta: { title: string; body: string; actions: ParadeCta[] };
  };
};

export const cincoDeMayoParadeCopy: Record<ParadeLang, ParadeLocaleCopy> = {
  es: {
    metaTitle: "Cinco de Mayo Parade | Puebla en el mapa mundial",
    metaDescription:
      "Un desfile de marching bands el domingo más cercano al 5 de mayo. Ponemos a Puebla en el ojo del mundo y aspiramos a que su Centro Histórico esté entre los cinco destinos históricos más visitados.",
    brand: "Barriando",
    eventName: "Cinco de Mayo Parade",
    dateRule: "El domingo más cercano al 5 de mayo · Puebla, México",
    heroMission:
      "Convertir a Puebla en el centro mundial de la celebración del Cinco de Mayo.",
    langLabel: "Idioma",
    ctaPrimary: "Sé parte",
    sections: {
      vision: {
        title: "La visión",
        body: "Queremos poner a Puebla en el mapa y en el ojo de todo el mundo. El Cinco de Mayo Parade es la proyección de un desfile icónico —con marching bands como eje— que haga de la ciudad el referente global de esta fecha.",
      },
      whyPuebla: {
        title: "Por qué Puebla",
        body: "El Centro Histórico de Puebla figura entre los grandes centros históricos reconocidos por la UNESCO —hoy en el entorno del top 10, en la posición 7—. Nuestra ambición es clara: estar al menos en el top 5 de visitantes mundiales, elevando la relevancia turística y cultural de la ciudad.",
      },
      usaBridge: {
        title: "El puente USA–Puebla",
        body: "El Cinco de Mayo también se festeja en Estados Unidos, y a lo grande. Ese factor es una oportunidad única: conectar la celebración estadounidense con su origen simbólico en Puebla, y atraer miradas, bandas y visitantes de ambos lados de la frontera.",
      },
      parade: {
        title: "El desfile",
        body: "Un desfile de marching bands que recorre el corazón de Puebla el domingo más cercano al 5 de mayo. Música, disciplina y espectáculo callejero para que locales, turistas y audiencias internacionales vivan la ciudad como escenario de una celebración con proyección mundial.",
      },
      projection: {
        title: "Proyección",
        intro:
          "Metas de visión —no cifras inventadas como hechos—. Lo que buscamos construir:",
        goals: [
          {
            label: "Top 5 de visitantes",
            detail:
              "Que el Centro Histórico de Puebla ascienda en relevancia global entre destinos históricos.",
          },
          {
            label: "Centro de la celebración",
            detail:
              "Que Puebla sea el punto de referencia natural del Cinco de Mayo a escala mundial.",
          },
          {
            label: "Puente cultural USA–México",
            detail:
              "Aprovechar la fuerza del festejo en Estados Unidos para atraer bandas, medios y turismo.",
          },
          {
            label: "Marching bands como firma",
            detail:
              "Consolidar un desfile emblemático de bandas cada domingo más cercano al 5 de mayo.",
          },
        ],
      },
      cta: {
        title: "Sé parte del desfile",
        body: "Si eres una marching band, un patrocinador o quieres sumarte al proyecto, escríbenos. Empezamos por conversar.",
        actions: [
          {
            id: "band",
            label: "Soy una banda",
            subject: "Cinco de Mayo Parade — Marching band interesada",
          },
          {
            id: "sponsor",
            label: "Quiero patrocinar",
            subject: "Cinco de Mayo Parade — Interés en patrocinio",
          },
          {
            id: "join",
            label: "Quiero unirme",
            subject: "Cinco de Mayo Parade — Quiero ser parte del proyecto",
          },
        ],
      },
    },
  },
  en: {
    metaTitle: "Cinco de Mayo Parade | Putting Puebla on the world map",
    metaDescription:
      "A marching-band parade on the Sunday closest to May 5. We aim to put Puebla in the global spotlight and move its Historic Center toward the top five most-visited historic destinations.",
    brand: "Barriando",
    eventName: "Cinco de Mayo Parade",
    dateRule: "The Sunday closest to May 5 · Puebla, Mexico",
    heroMission:
      "Make Puebla the world’s center for Cinco de Mayo celebration.",
    langLabel: "Language",
    ctaPrimary: "Get involved",
    sections: {
      vision: {
        title: "The vision",
        body: "We want to put Puebla on the map—and in the world’s eye. The Cinco de Mayo Parade is the projection of an iconic marching-band parade that makes the city the global reference for this date.",
      },
      whyPuebla: {
        title: "Why Puebla",
        body: "Puebla’s Historic Center stands among the great UNESCO-recognized historic centers—today around the top 10, in position 7. Our ambition is clear: reach at least the top 5 in worldwide visitors, raising the city’s cultural and tourism standing.",
      },
      usaBridge: {
        title: "The USA–Puebla bridge",
        body: "Cinco de Mayo is also celebrated across the United States—and celebrated big. That is a rare opportunity: connect the U.S. festivities with their symbolic home in Puebla, and draw bands, attention, and visitors from both sides of the border.",
      },
      parade: {
        title: "The parade",
        body: "A marching-band parade through the heart of Puebla on the Sunday closest to May 5. Music, discipline, and street spectacle so locals, travelers, and international audiences experience the city as the stage for a celebration with worldwide reach.",
      },
      projection: {
        title: "Ambition",
        intro: "Vision goals—not invented facts. What we are building toward:",
        goals: [
          {
            label: "Top 5 visitors",
            detail:
              "Elevate Puebla’s Historic Center among the world’s most-visited historic destinations.",
          },
          {
            label: "Home of the celebration",
            detail:
              "Make Puebla the natural global reference point for Cinco de Mayo.",
          },
          {
            label: "USA–Mexico cultural bridge",
            detail:
              "Leverage U.S. Cinco de Mayo energy to attract bands, media, and tourism.",
          },
          {
            label: "Marching bands as signature",
            detail:
              "Establish an emblematic band parade every Sunday closest to May 5.",
          },
        ],
      },
      cta: {
        title: "Be part of the parade",
        body: "Whether you are a marching band, a sponsor, or want to join the project—write us. We start with a conversation.",
        actions: [
          {
            id: "band",
            label: "I’m a band",
            subject: "Cinco de Mayo Parade — Interested marching band",
          },
          {
            id: "sponsor",
            label: "I want to sponsor",
            subject: "Cinco de Mayo Parade — Sponsorship interest",
          },
          {
            id: "join",
            label: "I want to join",
            subject: "Cinco de Mayo Parade — Join the project",
          },
        ],
      },
    },
  },
};

export function mailtoFor(subject: string): string {
  return `mailto:${PARADE_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export function parseParadeLang(value: string | null | undefined): ParadeLang {
  return value === "en" ? "en" : "es";
}
