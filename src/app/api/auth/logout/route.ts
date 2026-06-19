import { destroySession } from "@/lib/auth";
import { secureJson } from "@/lib/api";

export async function POST() {
  await destroySession();
  return secureJson({ ok: true });
}
