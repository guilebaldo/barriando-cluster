import { signOut } from "@/auth";
import { secureJson } from "@/lib/api";

export async function POST() {
  await signOut({ redirect: false });
  return secureJson({ ok: true });
}
