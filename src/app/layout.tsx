import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./components/Providers";

export const viewport: Viewport = {
  themeColor: "#27366D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Barriando — Clúster Turístico del Centro Histórico de Puebla",
  description:
    "Barriando articula empresas del Centro Histórico de Puebla para desarrollar productos y servicios turísticos, festivales y derrama económica local.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Barriando",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
