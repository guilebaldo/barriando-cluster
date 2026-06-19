import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clúster Turístico de Puebla",
  description:
    "Ecosistema de cooperación turística que articula empresas, instituciones y comunidad para el desarrollo turístico y económico de Puebla.",
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