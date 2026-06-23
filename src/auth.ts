// auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import { barriandoPrismaAdapter } from "@/lib/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { MembershipPlan, UserRole } from "@/generated/prisma/client";

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

if (process.env.APPLE_ID && process.env.APPLE_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

providers.push(
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const email = credentials.email as string;
      const password = credentials.password as string;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.nombre,
        image: user.image,
      };
    },
  })
);

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
  adapter: barriandoPrismaAdapter(prisma),
  debug: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.id = user.id;
      }

      if (token.id && (user?.id || trigger === "update")) {
        const enriched = await enrichTokenFromDb(token.id as string);
        if (enriched) {
          token.socioId = enriched.socioId;
          token.role = enriched.role;
          token.nombre = enriched.nombre;
          token.plan = enriched.plan;
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
    async createUser({ user }) {
      if (user.id) {
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
      }
    },
  },
});
