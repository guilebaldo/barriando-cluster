import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
];

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
