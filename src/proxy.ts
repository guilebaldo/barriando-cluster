import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // No redirigir callbacks OAuth (POST); rompería el flujo de Google/Apple.
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const proto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host");

  if (
    process.env.NODE_ENV === "production" &&
    proto === "http" &&
    host &&
    !host.includes("localhost")
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
