/**
 * Constantes de sello compartidas por servidor y cliente.
 *
 * Vive aparte de `pasaporte-stamps` porque ese módulo importa Prisma: si un
 * componente `"use client"` lo importa, el bundle del navegador arrastra
 * `@/lib/prisma` y revienta con "DATABASE_URL is not set" al hidratar.
 */

/** Radio máximo al local para validar sello (GPS urbano típico ~10–50 m de error). */
export const STAMP_MAX_DISTANCE_M = 200;
