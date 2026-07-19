import { PLAN_PRICES_MXN, isBusinessPlan } from "@/lib/membresia";
import type { CatalogMembershipRow } from "@/app/admin/actions";

export type AdminOpsStats = {
  activeRoster: number;
  pendingPayments: number;
  pendingLinkages: number;
  expiringSoon: number;
  unlinkedActive: number;
  mrrEstimate: number;
};

type OpsUser = {
  socioId: number | null;
  status: string;
  linkageStatus: string | null;
  currentPeriodEnd: string | null;
  profile: { businessName: string | null } | null;
};

export function computeAdminOpsStats(
  membershipRows: CatalogMembershipRow[],
  users: OpsUser[]
): AdminOpsStats {
  const now = Date.now();
  const in15 = now + 15 * 24 * 60 * 60 * 1000;
  const linkedIds = new Set(
    users.filter((u) => u.socioId != null).map((u) => u.socioId as number)
  );

  let activeRoster = 0;
  let unlinkedActive = 0;
  let expiringSoon = 0;
  let mrrEstimate = 0;

  for (const row of membershipRows) {
    if (row.status !== "active" || !isBusinessPlan(row.plan)) continue;
    activeRoster += 1;
    if (row.plan in PLAN_PRICES_MXN) {
      mrrEstimate += PLAN_PRICES_MXN[row.plan as keyof typeof PLAN_PRICES_MXN];
    }
    if (!linkedIds.has(row.socioId)) unlinkedActive += 1;

    const linked = users.find((u) => u.socioId === row.socioId);
    const endIso = linked?.currentPeriodEnd ?? row.currentPeriodEnd;
    const end = endIso ? new Date(endIso).getTime() : null;
    if (end && end >= now && end <= in15) expiringSoon += 1;
  }

  const pendingPayments = users.filter((u) => u.status === "manual_pending").length;
  const pendingLinkages = users.filter(
    (u) => u.linkageStatus === "pending" && Boolean(u.profile?.businessName?.trim())
  ).length;

  return {
    activeRoster,
    pendingPayments,
    pendingLinkages,
    expiringSoon,
    unlinkedActive,
    mrrEstimate,
  };
}

export function formatExpiryShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}
