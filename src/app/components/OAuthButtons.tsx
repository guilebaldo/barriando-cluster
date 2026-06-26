"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCsrfToken, signIn, signOut } from "next-auth/react";
import { ONBOARDING_CONTINUE_PATH } from "@/lib/plan-routing";

async function submitOAuthForm(csrfToken: string) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/auth/signin/google";
  form.style.display = "none";

  for (const [name, value] of Object.entries({
    csrfToken,
    callbackUrl: ONBOARDING_CONTINUE_PATH,
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

export function OAuthButtons() {
  return (
    <Suspense fallback={null}>
      <OAuthButtonsInner />
    </Suspense>
  );
}

function OAuthButtonsInner() {
  const searchParams = useSearchParams();
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const authError = searchParams.get("error");
    if (!authError) return;

    console.error("[auth] login error param:", authError);

    if (authError === "OAuthAccountNotLinked") {
      void signOut({ redirect: false }).then(() => {
        setError(
          "Tu cuenta de Google no estaba vinculada. Sesión anterior limpiada; intenta de nuevo."
        );
      });
      return;
    }

    setError("No se pudo iniciar sesión con Google. Intenta de nuevo.");
  }, [searchParams]);

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
      // Evita OAuthAccountNotLinked por sesión JWT previa de otro usuario.
      await signOut({ redirect: false });

      const result = await signIn("google", {
        redirectTo: ONBOARDING_CONTINUE_PATH,
        callbackUrl: ONBOARDING_CONTINUE_PATH,
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
        redirectTo: ONBOARDING_CONTINUE_PATH,
        callbackUrl: ONBOARDING_CONTINUE_PATH,
      });
    } catch {
      if (csrfToken) {
        submitOAuthForm(csrfToken);
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
        className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-lg py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 shadow-sm"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {loading ? "Redirigiendo..." : "Iniciar sesión con Google"}
      </button>
      {error && <p className="text-xs text-red-600 text-center mt-3">{error}</p>}
    </div>
  );
}
