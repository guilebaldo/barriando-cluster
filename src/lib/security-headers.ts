/** Headers de seguridad compartidos (Next.js `headers()`). */
export const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js + Auth.js + Maps + Stripe. unsafe-inline/eval necesarios para el runtime de Next.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com https://js.stripe.com https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.googleusercontent.com https://maps.gstatic.com https://*.googleapis.com https://*.ggpht.com",
      "connect-src 'self' https://*.googleapis.com https://maps.googleapis.com https://api.stripe.com https://accounts.google.com https://*.neon.tech wss://*.neon.tech",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];
