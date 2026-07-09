"use client";

import { GoogleSignInButton } from "../components/GoogleSignInButton";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="w-5 h-5 shrink-0">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3 2.3c1.8-1.6 2.8-3.9 2.8-6.8 0-.7-.1-1.4-.2-2H12z" />
      <path fill="#34A853" d="M12 21c2.7 0 4.9-.9 6.5-2.5l-3-2.3c-.8.6-1.9 1-3.5 1-2.7 0-4.9-1.8-5.7-4.2l-3.1 2.4C4.9 18.8 8.2 21 12 21z" />
      <path fill="#4A90E2" d="M6.3 13c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.2 6.6C2.4 8 2 9.5 2 11s.4 3 1.2 4.4L6.3 13z" />
      <path fill="#FBBC05" d="M12 4.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 1.9 14.7 1 12 1 8.2 1 4.9 3.2 3.2 6.6L6.3 9c.8-2.4 3-4.2 5.7-4.2z" />
    </svg>
  );
}

export default function PasaporteGoogleCta() {
  return (
    <GoogleSignInButton
      callbackUrl="/pasaporte"
      loadingLabel="Abriendo Google..."
      className="inline-flex items-center gap-3 bg-white hover:bg-slate-100 text-slate-900 text-sm font-bold px-6 py-3.5 rounded-lg transition active:scale-[0.98] disabled:opacity-60"
    >
      <GoogleMark />
      Continuar con Google
    </GoogleSignInButton>
  );
}
