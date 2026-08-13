type SectionRow = {
  id: string;
  show?: boolean;
  detail?: unknown;
};

export function resolvePanelSection(
  requested: string | null | undefined,
  rows: SectionRow[]
): string | null {
  const details = rows.filter((r) => r.show !== false && r.detail);
  if (details.length === 0) return null;
  if (!requested) return details[0]?.id ?? null;
  if (requested === "membresia") {
    return (
      details.find((r) => r.id === "membresia")?.id ??
      details.find((r) => r.id === "vecino")?.id ??
      details.find((r) => r.id === "pay")?.id ??
      details[0]?.id ??
      null
    );
  }
  return details.find((r) => r.id === requested)?.id ?? details[0]?.id ?? null;
}

export function panelUrlWithSection(id: string | null): string {
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  if (id) params.set("seccion", id);
  else params.delete("seccion");
  const q = params.toString();
  return q ? `/panel?${q}` : "/panel";
}
