"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getCsrfToken, signIn, signOut, useSession } from "next-auth/react";

async function submitOAuthForm(csrfToken: string, callbackUrl: string) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/auth/signin/google";
  form.style.display = "none";

  for (const [name, value] of Object.entries({
    csrfToken,
    callbackUrl,
  })) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

type GoogleSignInButtonProps = {
  callbackUrl: string;
  label?: string;
  loadingLabel?: string;
  className?: string;
  children?: ReactNode;
};

export function GoogleSignInButton({
  callbackUrl,
  label = "Continuar con Google",
  loadingLabel = "Redirigiendo...",
  className,
  children,
}: GoogleSignInButtonProps) {
  const { status } = useSession();
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCsrfToken()
      .then((token) => {
        if (token) setCsrfToken(token);
      })
      .catch(() => {
        setError("No se pudo preparar el inicio de sesión. Recarga la página.");
      });
  }, []);

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);

    try {
      if (status === "authenticated") {
        await signOut({ redirect: false });
      }

      const result = await signIn("google", {
        redirectTo: callbackUrl,
        callbackUrl,
        redirect: false,
      });

      if (result?.url) {
        window.location.assign(result.url);
        return;
      }

      if (result?.error) {
        setError("No se pudo conectar con Google. Intenta de nuevo.");
        return;
      }

      await signIn("google", {
        redirectTo: callbackUrl,
        callbackUrl,
      });
    } catch {
      if (csrfToken) {
        submitOAuthForm(csrfToken, callbackUrl);
        return;
      }
      setError("Error al iniciar sesión. Recarga la página e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={handleGoogleSignIn}
        className={
          className ??
          "w-full flex items-center justify-center gap-2 border border-slate-200 rounded-lg py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 shadow-sm"
        }
      >
        {loading ? loadingLabel : (children ?? label)}
      </button>
      {error && <p className="text-xs text-red-600 text-center mt-3">{error}</p>}
    </div>
  );
}
