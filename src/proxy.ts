import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parsePlanSlug } from "@/lib/plan-routing";
import {
  PENDING_PLAN_COOKIE,
  pendingPlanCookieOptions,
  pendingPlanCookieValue,
} from "@/lib/pending-plan-cookie";

/**
 * Solo escribe la cookie si hay `?plan=` válido.
 * Nunca default a TURISTA: eso borraba el plan elegido en /registro al pasar por /login.
 */
function attachPendingPlanCookie(request: NextRequest, response: NextResponse) {
  const plan = parsePlanSlug(request.nextUrl.searchParams.get("plan"));
  if (!plan) return response;
  response.cookies.set(
    PENDING_PLAN_COOKIE,
    pendingPlanCookieValue(plan),
    pendingPlanCookieOptions()
  );
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/onboarding")) {
    return NextResponse.next();
  }

  const proto = request.headers.get("x-forwarded-proto");
  const hostHeader = request.headers.get("host") ?? "";
  const hostname = hostHeader.split(":")[0]?.toLowerCase() ?? "";

  // Dominio canónico: barriando.org (apex). Redirige el dominio legacy y www.
  if (process.env.NODE_ENV === "production") {
    const legacyHosts = new Set([
      "barriandopuebla.com",
      "www.barriandopuebla.com",
      "www.barriando.org",
    ]);
    if (legacyHosts.has(hostname)) {
      const dest = request.nextUrl.clone();
      dest.protocol = "https:";
      dest.hostname = "barriando.org";
      dest.port = "";
      return NextResponse.redirect(dest, 308);
    }
  }

  if (
    process.env.NODE_ENV === "production" &&
    proto === "http" &&
    hostname &&
    !hostname.includes("localhost")
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  // Next.js no permite cookies().set() en Server Components (login/registro).
  if (pathname === "/login" || pathname === "/registro") {
    return attachPendingPlanCookie(request, NextResponse.next());
  }

  const response = NextResponse.next();
  if (pathname === "/panel" || pathname.startsWith("/panel/")) {
    response.headers.set("Cache-Control", "no-store, must-revalidate");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
