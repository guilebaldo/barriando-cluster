export type LinkageStatus = "pending" | "approved" | "rejected";

export function normalizeLinkageStatus(raw?: string | null): LinkageStatus {
  if (raw === "approved" || raw === "rejected") return raw;
  return "pending";
}

export function getLinkageStatusLabel(status: LinkageStatus): string {
  if (status === "approved") return "Verificado";
  if (status === "rejected") return "Rechazado";
  return "Pendiente de aprobación";
}

export function isLinkageApproved(status?: string | null): boolean {
  return normalizeLinkageStatus(status) === "approved";
}

export function isLinkagePending(status?: string | null): boolean {
  return normalizeLinkageStatus(status) === "pending";
}
