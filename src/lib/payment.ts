/** Datos bancarios de la asociación para pagos manuales (solo servidor). */

export type BarriandoPaymentDetails = {
  clabe: string;
  bankLabel: string;
  paymentEmail: string;
};

const DEFAULT_CLABE = "646180157000000004";
const DEFAULT_PAYMENT_EMAIL = "hola@barriandopuebla.com";
const DEFAULT_BANK_LABEL = "STP — Asociación Barriando";

/** Leer en Server Components y pasar como props a clientes. */
export function getBarriandoPaymentDetails(): BarriandoPaymentDetails {
  return {
    clabe: process.env.BARRIANDO_CLABE?.trim() || DEFAULT_CLABE,
    paymentEmail: process.env.BARRIANDO_PAYMENT_EMAIL?.trim() || DEFAULT_PAYMENT_EMAIL,
    bankLabel: process.env.BARRIANDO_BANK_LABEL?.trim() || DEFAULT_BANK_LABEL,
  };
}
