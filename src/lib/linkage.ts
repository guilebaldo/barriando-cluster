export type LinkageStatus = "pending" | "approved" | "rejected";

export function normalizeLinkageStatus(raw?: string | null): LinkageStatus | null {
  if (raw === "approved" || raw === "rejected" || raw === "pending") return raw;
  return null;
}

export function getLinkageStatusLabel(status: LinkageStatus): string {
  if (status === "approved") return "Verificado";
  if (status === "rejected") return "Rechazado";
  return "Pendiente de aprobación";
}

export function isLinkageApproved(status?: string | null): boolean {
  return status === "approved";
}

export function isLinkagePending(status?: string | null): boolean {
  return status === "pending";
}

export function isLinkageRejected(status?: string | null): boolean {
  return status === "rejected";
}
