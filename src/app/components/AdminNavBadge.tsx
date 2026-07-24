"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminNotificationBadge from "@/app/components/AdminNotificationBadge";

type Counts = { payments: number; linkages: number; total: number };

function useAdminPendingCounts() {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as Counts;
      if (typeof data.total === "number") setCounts(data);
    } catch {
      // Silencioso: el badge es opcional.
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load, pathname]);

  useEffect(() => {
    function onFocus() {
      void load();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  return counts;
}

function pendingTitle(counts: Counts): string {
  const parts: string[] = [];
  if (counts.payments > 0) {
    parts.push(
      counts.payments === 1
        ? "1 pago por validar"
        : `${counts.payments} pagos por validar`
    );
  }
  if (counts.linkages > 0) {
    parts.push(
      counts.linkages === 1
        ? "1 vinculación pendiente"
        : `${counts.linkages} vinculaciones pendientes`
    );
  }
  return parts.join(" · ");
}

function adminHref(counts: Counts | null): string {
  if (!counts || counts.total <= 0) return "/admin";
  if (counts.payments > 0) return "/admin?focus=payments";
  if (counts.linkages > 0) return "/admin?focus=linkages";
  return "/admin";
}

/** Badge junto a un enlace ADMIN existente (solo el círculo). */
export default function AdminNavBadge() {
  const counts = useAdminPendingCounts();
  if (!counts || counts.total <= 0) return null;

  return (
    <AdminNotificationBadge
      count={counts.total}
      className="ml-1.5 align-middle"
      title={pendingTitle(counts)}
    />
  );
}

/** Enlace ADMIN con badge y deep-link a la cola pendiente. */
export function AdminNavLink({
  className,
  children,
  onClick,
  role,
}: {
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  role?: string;
}) {
  const counts = useAdminPendingCounts();
  const href = adminHref(counts);

  return (
    <Link href={href} className={className} onClick={onClick} role={role}>
      {children ?? "ADMIN"}
      {counts && counts.total > 0 ? (
        <AdminNotificationBadge
          count={counts.total}
          className="ml-1.5 align-middle"
          title={pendingTitle(counts)}
        />
      ) : null}
    </Link>
  );
}
