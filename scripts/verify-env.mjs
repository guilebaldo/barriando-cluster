#!/usr/bin/env node
/**
 * Comprueba .env sin imprimir valores secretos.
 * Uso: npm run env:check
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env");

function loadEnvFile(path) {
  if (!existsSync(path)) return null;
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function stripeMode(key) {
  if (!key) return null;
  if (key.startsWith("sk_test_")) return "test";
  if (key.startsWith("sk_live_")) return "live";
  return "unknown";
}

function publishableMode(key) {
  if (!key) return null;
  if (key.startsWith("pk_test_")) return "test";
  if (key.startsWith("pk_live_")) return "live";
  return "unknown";
}

const env = loadEnvFile(envPath);
const warnings = [];
const errors = [];
const ok = [];

if (!env) {
  console.error("❌ No existe .env — copia desde .env.example: cp .env.example .env");
  process.exit(1);
}

const required = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "NEXT_PUBLIC_APP_URL",
];

for (const key of required) {
  if (!env[key]?.trim()) errors.push(`Falta o está vacío: ${key}`);
  else ok.push(key);
}

if (env.AUTH_SECRET && env.AUTH_SECRET.length < 32) {
  warnings.push("AUTH_SECRET corto (< 32 chars). Genera uno: openssl rand -base64 32");
}

if (env.DATABASE_URL && !env.DATABASE_URL.startsWith("postgresql://")) {
  errors.push("DATABASE_URL debe ser postgresql://…");
}

if (env.NEON_BRANCH === "production" && env.NODE_ENV !== "production") {
  warnings.push(
    "NEON_BRANCH=production en .env local — considera una rama dev de Neon para no tocar prod"
  );
}

const skMode = stripeMode(env.STRIPE_SECRET_KEY);
const pkMode = publishableMode(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
if (env.STRIPE_SECRET_KEY || env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  if (!skMode || skMode === "unknown") {
    warnings.push("STRIPE_SECRET_KEY no parece sk_test_ ni sk_live_");
  }
  if (!pkMode || pkMode === "unknown") {
    warnings.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY no parece pk_test_ ni pk_live_");
  }
  if (skMode && pkMode && skMode !== pkMode) {
    errors.push(`Stripe: secret es ${skMode} pero publishable es ${pkMode} — deben coincidir`);
  } else if (skMode && pkMode) {
    ok.push(`Stripe (${skMode})`);
  }
}

const priceKeys = [
  "STRIPE_PRICE_ID_VECINO",
  "STRIPE_PRICE_ID_NEGOCIO_FAMILIAR",
  "STRIPE_PRICE_ID_MEDIANA_EMPRESA",
  "STRIPE_PRICE_ID_GRAN_EMPRESA",
];
const pricesSet = priceKeys.filter((k) => env[k]?.startsWith("price_"));
if (env.STRIPE_SECRET_KEY && pricesSet.length === 0 && !env.STRIPE_PRICE_ID) {
  warnings.push("Stripe configurado pero faltan STRIPE_PRICE_ID_* (o STRIPE_PRICE_ID genérico)");
}

if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
  warnings.push("Google OAuth incompleto (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)");
} else {
  ok.push("Google OAuth");
}

if (!env.RESEND_API_KEY) {
  warnings.push("RESEND_API_KEY ausente — magic link por correo deshabilitado");
} else if (!env.RESEND_API_KEY.startsWith("re_")) {
  warnings.push("RESEND_API_KEY no empieza con re_");
} else {
  ok.push("Resend");
}

if (!env.STRIPE_WEBHOOK_SECRET?.trim()) {
  warnings.push("STRIPE_WEBHOOK_SECRET vacío — webhooks solo con Stripe CLI en local");
}

if (!env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || !env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) {
  warnings.push("Faltan keys de Google Maps/Places");
} else {
  ok.push("Google Maps/Places");
}

const localUrl = env.NEXT_PUBLIC_APP_URL?.includes("localhost");
const authLocal = env.AUTH_URL?.includes("localhost");
if (localUrl !== authLocal) {
  warnings.push("NEXT_PUBLIC_APP_URL y AUTH_URL deberían apuntar al mismo entorno (local o prod)");
}

console.log("\n🔍 env:check — barriando-cluster\n");
if (ok.length) console.log("✓ OK:", ok.join(", "));
if (warnings.length) {
  console.log("\n⚠️  Avisos:");
  for (const w of warnings) console.log("   •", w);
}
if (errors.length) {
  console.log("\n❌ Errores:");
  for (const e of errors) console.log("   •", e);
  process.exit(1);
}

console.log("\n✅ Estructura básica OK. Prueba flujos reales: login Google, /mapa, checkout Stripe.\n");
process.exit(warnings.length ? 0 : 0);
