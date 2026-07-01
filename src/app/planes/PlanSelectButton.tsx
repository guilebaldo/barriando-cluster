"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { planToSlug } from "@/lib/plan-routing";
import type { MembershipPlan } from "@/generated/prisma/client";

interface PlanSelectButtonProps {
  planId: MembershipPlan;
  label: string;
  className: string;
}

export default function PlanSelectButton({ planId, label, className }: PlanSelectButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSelect() {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("plan", planToSlug(planId));
      const res = await fetch("/api/onboarding/select-plan", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !data.path) {
        throw new Error(data.error ?? "No se pudo cambiar el plan");
      }
      router.replace(data.path);
      router.refresh();
    } catch {
      router.replace("/planes?error=cambio_plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" disabled={loading} onClick={handleSelect} className={className}>
      {loading ? "Aplicando..." : label}
    </button>
  );
}
