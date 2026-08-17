export const ADMIN_TABS = [
  "overview",
  "operations",
  "accounts",
  "content",
  "hitos",
  "pases",
] as const;

export type AdminTab = (typeof ADMIN_TABS)[number];

const SECTION_ALIASES: Record<string, AdminTab> = {
  resumen: "overview",
  overview: "overview",
  dashboard: "overview",
  operaciones: "operations",
  operations: "operations",
  cuentas: "accounts",
  accounts: "accounts",
  contenido: "content",
  content: "content",
  hitos: "hitos",
  pases: "pases",
};

export function resolveAdminSection(
  seccion?: string | null,
  focus?: string | null
): AdminTab {
  if (focus === "payments" || focus === "linkages") return "operations";
  const key = seccion?.trim().toLowerCase() ?? "";
  return SECTION_ALIASES[key] ?? "overview";
}

export function adminUrlWithSection(id: AdminTab, focus?: string | null): string {
  const params = new URLSearchParams();
  params.set("seccion", id);
  if ((id === "operations" || id === "overview") && (focus === "payments" || focus === "linkages")) {
    params.set("focus", focus);
  }
  return `/admin?${params.toString()}`;
}
