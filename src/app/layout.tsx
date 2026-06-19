import type { Metadata } from "next";
import "./globals.css";
import Providers from "./components/Providers";

export const metadata: Metadata = {
  title: "Barriando — Clúster Turístico del Centro Histórico de Puebla",
  description:
    "Barriando articula empresas del Centro Histórico de Puebla para desarrollar productos y servicios turísticos, festivales y derrama económica local.",
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