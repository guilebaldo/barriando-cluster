"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { hasCommercialAccess } from "@/lib/membresia";
import { planToSlug, registroUrl } from "@/lib/plan-routing";
import type { MembershipPlan } from "@/generated/prisma/client";

type Props = {
  plan: MembershipPlan;
  className?: string;
  children: ReactNode;
  /** Si ya tiene ese plan activo, muestra este texto en lugar del CTA. */
  alreadyActiveMessage?: string;
  alreadyActiveClassName?: string;
  loadingLabel?: string;
  onBeforeNavigate?: () => void;
};

/**
 * CTA de membresía: sin sesión → /registro?plan=…
 * Con sesión → select-plan → /certificacion/pago (u home si ya tiene el plan).
 */
export default function PlanIntentCta({
  plan,
  className,
  children,
  alreadyActiveMessage,
  alreadyActiveClassName = "text-[10px] text-slate-500 cursor-default select-none",
  loadingLabel = "Continuando…",
  onBeforeNavigate,
}: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  if (status === "authenticated" && alreadyActiveMessage) {
    const userPlan = session.user?.plan;
    const subStatus = session.user?.subscriptionStatus ?? "inactive";
    if (userPlan === plan && hasCommercialAccess(plan, subStatus)) {
      return (
        <span
          className={alreadyActiveClassName}
          title={`Tu plan ${plan} ya está activo`}
        >
          {alreadyActiveMessage}
        </span>
      );
    }
  }

  async function handleClick() {
    onBeforeNavigate?.();
    setLoading(true);
    try {
      const form = new FormData();
      form.append("plan", planToSlug(plan));
      const res = await fetch("/api/onboarding/select-plan", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !data.path) {
        throw new Error(data.error ?? "No se pudo continuar");
      }
      router.push(data.path);
      router.refresh();
    } catch {
      router.push(registroUrl(plan));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading || status === "loading"}
      onClick={() => void handleClick()}
      className={className}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}
