// auth.ts — Auth.js v5 (NextAuth) hardened for Vercel + Neon
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { barriandoPrismaAdapter } from "@/lib/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { ONBOARDING_CONTINUE_PATH } from "@/lib/plan-routing";
import type { Provider } from "next-auth/providers";
import type { MembershipPlan, UserRole } from "@/generated/prisma/client";

const isProduction = process.env.NODE_ENV === "production";

/** Vercel requires trusting the Host header; env alone is not always applied by Auth.js. */
const TRUST_HOST = true as const;

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

const authSecret = readEnv("AUTH_SECRET", "NEXTAUTH_SECRET");
const authUrl = readEnv("AUTH_URL", "NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL")?.replace(/\/$/, "");

const googleClientId = readEnv("GOOGLE_CLIENT_ID", "AUTH_GOOGLE_ID");
const googleClientSecret = readEnv("GOOGLE_CLIENT_SECRET", "AUTH_GOOGLE_SECRET");

function logAuthBoot() {
  console.info("[auth] boot:", {
    trustHost: TRUST_HOST,
    secretConfigured: Boolean(authSecret),
    googleOAuth: Boolean(googleClientId && googleClientSecret),
    authUrl: authUrl ?? "(request host)",
    vercel: Boolean(process.env.VERCEL),
    nodeEnv: process.env.NODE_ENV,
  });
  if (isProduction && !authSecret) {
    console.error("[auth] Falta AUTH_SECRET o NEXTAUTH_SECRET en producción.");
  }
  if (isProduction && (!googleClientId || !googleClientSecret)) {
    console.warn("[auth] Faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET en producción.");
  }
}

logAuthBoot();

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  if (googleClientId && googleClientSecret) {
    providers.push(
      Google({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        allowDangerousEmailAccountLinking: true,
        // Sin PKCE: evita InvalidCheck si el navegador pierde la cookie en el redirect OAuth.
        checks: ["state"],
      })
    );
  } else if (isProduction) {
    console.warn("[auth] Google OAuth no registrado: credenciales incompletas.");
  }

  const appleId = readEnv("APPLE_ID", "AUTH_APPLE_ID");
  const appleSecret = readEnv("APPLE_SECRET", "AUTH_APPLE_SECRET");
  if (appleId && appleSecret) {
    providers.push(
      Apple({
        clientId: appleId,
        clientSecret: appleSecret,
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  return providers;
}

function hostMatches(originA: string, originB: string): boolean {
  try {
    const a = new URL(originA);
    const b = new URL(originB);
    const norm = (host: string) => host.replace(/^www\./i, "").toLowerCase();
    return norm(a.host) === norm(b.host) && a.protocol === b.protocol;
  } catch {
    return false;
  }
}

async function enrichTokenFromDb(userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  if (!dbUser) return null;
  return {
    socioId: dbUser.socioId ?? null,
    role: dbUser.role,
    nombre: dbUser.nombre ?? "",
    plan: (dbUser.subscription?.plan ?? "VECINO") as MembershipPlan,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: TRUST_HOST,
  secret: authSecret,
  basePath: "/api/auth",
  adapter: barriandoPrismaAdapter(prisma),
  useSecureCookies: isProduction,
  debug: readEnv("AUTH_DEBUG") === "true",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: buildProviders(),
  logger: {
    error(error) {
      const err = error as Error & { type?: string; cause?: unknown };
      console.error("[auth] error:", {
        type: err.type ?? err.name,
        message: err.message,
        cause: err.cause ?? null,
        ...(isProduction ? {} : { stack: err.stack }),
      });
    },
    warn(code) {
      console.warn("[auth] warn:", code);
    },
    debug(message, metadata) {
      if (!isProduction || readEnv("AUTH_DEBUG") === "true") {
        console.debug("[auth] debug:", message, metadata ?? "");
      }
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        const email = user.email ?? profile?.email;
        if (account?.provider === "google" && !email) {
          console.error("[auth] Google sign-in rechazado: perfil sin email.");
          return false;
        }
        if (account?.provider === "google" || account?.provider === "apple") {
          console.info("[auth] OAuth sign-in attempt:", {
            provider: account.provider,
            email,
            userId: user.id,
          });
        }
        return true;
      } catch (error) {
        console.error("[auth] signIn callback failed:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      const canonical = authUrl ?? baseUrl.replace(/\/$/, "");

      if (url.startsWith("/")) {
        return `${canonical}${url}`;
      }

      try {
        const target = new URL(url);
        if (hostMatches(target.origin, canonical) || hostMatches(target.origin, baseUrl)) {
          return url;
        }
        console.warn("[auth] redirect bloqueado (origen distinto):", {
          target: target.origin,
          canonical,
          baseUrl,
        });
      } catch {
        console.warn("[auth] redirect URL inválida:", url);
      }

      return `${canonical}${ONBOARDING_CONTINUE_PATH}`;
    },
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.id = user.id;
      }

      if (token.id && (user?.id || trigger === "update")) {
        try {
          const enriched = await enrichTokenFromDb(token.id as string);
          if (enriched) {
            token.socioId = enriched.socioId;
            token.role = enriched.role;
            token.nombre = enriched.nombre;
            token.plan = enriched.plan;
          }
        } catch (error) {
          // No tumbar OAuth si Neon tarda en el primer callback
          console.error("[auth] jwt enrich failed (session parcial):", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.socioId = (token.socioId as number | null) ?? null;
        session.user.role = (token.role as UserRole) ?? "SOCIO";
        session.user.plan = (token.plan as MembershipPlan) ?? "VECINO";
        if (token.nombre) session.user.name = token.nombre as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ account, user, isNewUser }) {
      console.info("[auth] signIn event:", {
        provider: account?.provider,
        userId: user.id,
        isNewUser,
      });
    },
    async linkAccount({ user, account }) {
      console.info("[auth] linkAccount event:", {
        provider: account.provider,
        userId: user.id,
      });
    },
    async createUser({ user }) {
      if (!user.id) return;
      try {
        const nombre = user.name || user.email?.split("@")[0] || "Usuario";
        await prisma.user.update({
          where: { id: user.id },
          data: { nombre },
        });
        await prisma.subscription.upsert({
          where: { userId: user.id },
          create: { userId: user.id, plan: "VECINO", status: "inactive" },
          update: {},
        });
      } catch (error) {
        console.error("[auth] createUser event failed:", error);
      }
    },
  },
});
