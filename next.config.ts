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
