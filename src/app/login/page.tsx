import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";
import { getSession } from "@/lib/auth-utils";
import { resolvePostAuthHomePath } from "@/lib/post-auth-home";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getSession();
  if (session) {
    const params = await searchParams;
    const raw = params.callbackUrl?.trim();
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
      redirect(raw);
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
