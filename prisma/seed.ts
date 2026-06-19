import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

const posts = [
  {
    slug: "quienes-somos-propuesta-valor",
    title: "Clúster Turístico de Puebla: quiénes somos y qué aportamos al desarrollo de la ciudad",
    excerpt:
      "Definimos con claridad nuestra identidad como ecosistema de cooperación turística y los beneficios que generamos para socios, aliados y visitantes.",
    content: `El **Clúster Turístico de Puebla** es un ecosistema de cooperación que articula empresas turísticas, instituciones públicas, academia y comunidades bajo la figura legal de **Asociación de Cooperación Turística**.

## ¿Qué hacemos?

- Coordinamos una red de empresas certificadas del sector turístico
- Impulsamos proyectos como el MUAAP para conectar patrimonio con desarrollo económico
- Generamos alianzas estratégicas con instituciones y organismos de promoción
- Posicionamos a Puebla como destino integral: cultural, de reuniones, negocios e innovación

## ¿A quién beneficia?

**Socios:** visibilidad, vinculación y participación en proyectos conjuntos.

**Aliados:** un interlocutor organizado para convenios y programas de desarrollo.

**Visitantes:** experiencias auténticas y rutas verificadas que distribuyen el beneficio económico en la ciudad.`,
    fecha: "18 Junio, 2026",
    autor: "Consejo Directivo",
  },
  {
    slug: "muaap-reactivacion-barrios",
    title: "El MUAAP y la reactivación turística en los barrios fundacionales",
    excerpt:
      "Cómo el inventario de hitos históricos está transformando la manera de caminar y consumir en el Centro Histórico de Puebla.",
    content: `El **Museo Urbano Andante Abierto de Puebla (MUAAP)** es nuestro proyecto insignia de promoción turística.

A través de un inventario patrimonial verificado, conectamos el Centro Histórico con barrios fundacionales. Los negocios certificados del Clúster actúan como custodios de la historia: la visita se vive caminando, observando fachadas y consumiendo en establecimientos de la red.

Este modelo distribuye el beneficio turístico más allá del circuito tradicional y fortalece el desarrollo económico local.`,
    fecha: "15 Junio, 2026",
    autor: "Clúster Turístico",
  },
  {
    slug: "turismo-reuniones-negocios",
    title: "Turismo de reuniones y negocios: nuevas oportunidades para Puebla",
    excerpt:
      "El Clúster amplía su posicionamiento integrando congresos, ferias y vinculación empresarial.",
    content: `Puebla tiene fortalezas que van mucho más allá del patrimonio y la gastronomía. El turismo de reuniones (MICE), los eventos corporativos y la vinculación con el ecosistema empresarial son ejes estratégicos del Clúster.

Trabajamos para articular hoteles, venues, operadores y servicios complementarios en una oferta coordinada que atraiga inversión, congresos y desarrollo económico sostenible.`,
    fecha: "08 Junio, 2026",
    autor: "Comité Editorial",
  },
  {
    slug: "gastronomia-cosme-tortas",
    title: "Gastronomía con identidad: La historia detrás de Cosme Tortas",
    excerpt:
      "Exploramos el valor patrimonial de las recetas tradicionales que dan identidad culinaria a nuestra red empresarial.",
    content: `La gastronomía identitaria es uno de los pilares del Clúster. Negocios como **Cosme Tortas** representan cómo la tradición culinaria se convierte en producto turístico de alto valor.

Apoyar a estos establecimientos significa preservar oficios, generar empleo local y ofrecer a los visitantes experiencias auténticas vinculadas a la memoria de Puebla.`,
    fecha: "02 Junio, 2026",
    autor: "Comité Editorial",
  },
];

async function main() {
  for (const post of posts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      create: post,
      update: post,
    });
  }
  console.log(`Seeded ${posts.length} blog posts`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
