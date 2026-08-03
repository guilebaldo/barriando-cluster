import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/map", destination: "/mapa", permanent: true },
      { source: "/map/:path*", destination: "/mapa/:path*", permanent: true },
      { source: "/muaap", destination: "/mapa", permanent: true },
      { source: "/socios", destination: "/cuponera", permanent: true },
      { source: "/socios/:path*", destination: "/cuponera/:path*", permanent: true },
      { source: "/pipope", destination: "/pipopetl", permanent: true },
      { source: "/landing-socios", destination: "/pipopetl", permanent: true },
      // QRs viejos de sello → pasaporte (redirect HTTP en el edge; estable en Safari Camera).
      {
        source: "/pasaporte/sellar/:slug",
        destination: "/pasaporte?pendiente=:slug",
        permanent: false,
      },
      {
        source: "/pasaporte/sellar",
        has: [{ type: "query", key: "restaurante", value: "(?<slug>[^&]+)" }],
        destination: "/pasaporte?pendiente=:slug",
        permanent: false,
      },
      {
        source: "/pasaporte/sellar",
        destination: "/pasaporte?error=restaurante_requerido",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
