"use client";

import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Props = {
  phone: string | null | undefined;
  /** Prefill for the WhatsApp compose box. */
  message?: string;
  disabled?: boolean;
  className?: string;
};

export default function AdminWhatsAppButton({
  phone,
  message,
  disabled,
  className = "p-2 rounded-lg text-emerald-700 hover:bg-emerald-50 disabled:opacity-40",
}: Props) {
  const href = buildWhatsAppUrl(phone, message);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title="Abrir WhatsApp"
      aria-label="Abrir WhatsApp"
      aria-disabled={disabled || undefined}
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
      className={className}
      data-cuelume-press=""
      data-cuelume-release=""
    >
      <MessageCircle className="w-4 h-4" />
      <span className="sr-only">WhatsApp</span>
    </a>
  );
}
