import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";
import { getSession } from "@/lib/auth-utils";
import { resolvePostAuthHomePath } from "@/lib/post-auth-home";

/** Recupera callback de sello si alguien mandó `?` sin encodear y se partió el query. */
function resolveCallbackUrl(params: {
  callbackUrl?: string;
  restaurante?: string;
}): string | null {
  const raw = params.callbackUrl?.trim();
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;

  const restaurante = params.restaurante?.trim();
  if (
    restaurante &&
    (raw === "/pasaporte/sellar" || raw === "/pasaporte/sellar/")
  ) {
    return `/pasaporte/sellar/${encodeURIComponent(restaurante)}`;
  }

  // /pasaporte/sellar?restaurante=foo llegó entero (bien encodeado)
  if (raw.startsWith("/pasaporte/sellar?")) {
    try {
      const url = new URL(raw, "http://local");
      const slug = url.searchParams.get("restaurante")?.trim();
      if (slug) return `/pasaporte/sellar/${encodeURIComponent(slug)}`;
    } catch {
      /* keep raw */
    }
  }

  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; restaurante?: string }>;
}) {
  const session = await getSession();
  if (session) {
    const params = await searchParams;
    const callback = resolveCallbackUrl(params);
    if (callback) {
      redirect(callback);
    }
    redirect(
      resolvePostAuthHomePath({
        email: session.email,
        role: session.role,
        plan: session.plan,
        subscriptionStatus: session.subscriptionStatus,
      })
    );
  }

  return <LoginClient />;
}
