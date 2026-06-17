import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clúster Turístico de Puebla",
  description: "Asociación de Cooperación Turística de los barrios tradicionales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}