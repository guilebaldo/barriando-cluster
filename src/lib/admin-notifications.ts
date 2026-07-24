import { prisma } from "@/lib/prisma";

export type AdminPendingCounts = {
  payments: number;
  linkages: number;
  total: number;
};

/** Conteos de acciones admin pendientes (pagos transfer / vinculaciones). */
export async function getAdminPendingCounts(): Promise<AdminPendingCounts> {
  const [payments, linkages] = await Promise.all([
    prisma.subscription.count({
      where: { status: "manual_pending" },
    }),
    prisma.socioProfile.count({
      where: {
        linkageStatus: "pending",
        businessName: { not: null },
        NOT: { businessName: "" },
      },
    }),
  ]);

  return {
    payments,
    linkages,
    total: payments + linkages,
  };
}
