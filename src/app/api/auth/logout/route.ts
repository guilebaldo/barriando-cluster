import { NextRequest } from "next/server";
import { signOut } from "@/auth";
import { secureError, secureJson } from "@/lib/api";

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!host) return false;

  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  // Fetch same-origin a veces omite Origin; aceptar Referer del mismo host.
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    return new URL(referer).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return secureError("Origen no permitido.", 403);
  }
  await signOut({ redirect: false });
  return secureJson({ ok: true });
}
