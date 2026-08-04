import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_SOCIOS_TAG } from "@/lib/public-socios-tag";

export { PUBLIC_SOCIOS_TAG };

/**
 * Invalida el roster público (cuponera / carrusel / stats) tras publicar,
 * editar beneficios o cambiar membresías.
 * Solo importar desde Server Actions / Route Handlers.
 */
export function revalidatePublicSocios() {
  revalidateTag(PUBLIC_SOCIOS_TAG, "max");
  revalidatePath("/cuponera");
  revalidatePath("/mapa");
  revalidatePath("/pasaporte");
  revalidatePath("/");
  revalidatePath("/inicio");
}
