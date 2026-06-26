import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterUser } from "@auth/core/adapters";
import type { PrismaClient, User } from "@/generated/prisma/client";

function resolveNombre(name: string | null | undefined, email: string | null | undefined) {
  return name?.trim() || email?.split("@")[0] || "Usuario";
}

function toAdapterUser(user: User): AdapterUser {
  return {
    id: user.id,
    email: user.email ?? "",
    emailVerified: user.emailVerified,
    name: user.nombre ?? resolveNombre(null, user.email),
    image: user.image,
  };
}

/** Auth.js usa `name`; nuestro schema Prisma usa `nombre`. */
export function barriandoPrismaAdapter(prisma: PrismaClient): Adapter {
  const base = PrismaAdapter(prisma);

  return {
    ...base,
    async createUser(data) {
      const email = data.email?.trim().toLowerCase() ?? data.email;
      const user = await prisma.user.create({
        data: {
          email,
          emailVerified: data.emailVerified,
          image: data.image,
          nombre: resolveNombre(data.name, email),
        },
      });
      return toAdapterUser(user);
    },
    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } });
      return user ? toAdapterUser(user) : null;
    },
    async getUserByEmail(email) {
      const normalized = email.trim().toLowerCase();
      const user = await prisma.user.findFirst({
        where: { email: { equals: normalized, mode: "insensitive" } },
      });
      return user ? toAdapterUser(user) : null;
    },
    async getUserByAccount(provider_providerAccountId) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId },
        include: { user: true },
      });
      return account?.user ? toAdapterUser(account.user) : null;
    },
    async updateUser(data) {
      const { id, name, email, emailVerified, image } = data;
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(email !== undefined && { email }),
          ...(emailVerified !== undefined && { emailVerified }),
          ...(image !== undefined && { image }),
          ...(name !== undefined && { nombre: resolveNombre(name, email) }),
        },
      });
      return toAdapterUser(user);
    },
    async getSessionAndUser(sessionToken) {
      const userAndSession = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!userAndSession) return null;
      const { user, ...session } = userAndSession;
      return { user: toAdapterUser(user), session };
    },
  };
}
