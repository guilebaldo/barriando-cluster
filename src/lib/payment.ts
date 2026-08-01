/** Datos bancarios de la asociación para pagos manuales (solo servidor). */

export type BarriandoPaymentDetails = {
  clabe: string;
  bankLabel: string;
  paymentEmail: string;
};

const DEV_CLABE = "646180157000000004";
const DEFAULT_PAYMENT_EMAIL = "hola@barriandopuebla.com";
const DEFAULT_BANK_LABEL = "STP — Asociación Barriando";

/**
 * Leer en Server Components y pasar como props a clientes.
 * En producción la CLABE sale solo de BARRIANDO_CLABE: así se puede rotar sin
 * redeploy y una edición del repo no puede desviar los pagos. Si falta, la UI
 * cae al contacto por correo en lugar de mostrar una cuenta obsoleta.
 */
export function getBarriandoPaymentDetails(): BarriandoPaymentDetails {
  const envClabe = process.env.BARRIANDO_CLABE?.trim();
  const clabe =
    envClabe || (process.env.NODE_ENV === "production" ? "" : DEV_CLABE);

  if (!clabe && process.env.NODE_ENV === "production") {
    console.error("[payment] Falta BARRIANDO_CLABE: se ocultará la opción de transferencia.");
  }

  return {
    clabe,
    paymentEmail: process.env.BARRIANDO_PAYMENT_EMAIL?.trim() || DEFAULT_PAYMENT_EMAIL,
    bankLabel: process.env.BARRIANDO_BANK_LABEL?.trim() || DEFAULT_BANK_LABEL,
  };
}
