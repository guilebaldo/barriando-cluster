import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./components/Providers";
import { auth } from "@/auth";

export const viewport: Viewport = {
  themeColor: "#27366D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Barriando — Clúster Turístico del Centro Histórico de Puebla",
  description:
    "Barriando articula empresas del Centro Histórico de Puebla para desarrollar productos y servicios turísticos, festivales y derrama económica local.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "BarriApp",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/logos/favicon.png", type: "image/png" },
      { url: "/logos/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/logos/favicon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Primera pintura con sesión: clase del shell antes de hidratar y sesión ya
  // resuelta en el cliente (si no, el hub tarda en montar y queda el hueco navy).
  const session = await auth();
  const appShell = Boolean(session?.user?.id);

  return (
    <html lang="es" className={appShell ? "app-mobile-shell" : undefined}>
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
