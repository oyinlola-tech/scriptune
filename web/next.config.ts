import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // The shared contracts package lives outside web/, so both bundlers are told about the repo root.
  transpilePackages: ["@scriptune/contracts"],
  turbopack: { root: path.join(__dirname, "..") },
  outputFileTracingRoot: path.join(__dirname, ".."),
  images: { formats: ["image/avif", "image/webp"] },
  poweredByHeader: false,
  async headers() {
    const api = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      // Next's inline bootstrap and the theme script need 'unsafe-inline'; styles are inlined by Tailwind/Next.
      "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      `connect-src 'self' ${api}`,
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      // Only the giving widget on /support may be framed in.
      "frame-src https://myhappr.com",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), browsing-topics=()" },
        ],
      },
    ];
  },
};

/**
 * The service worker is bundled by Serwist through webpack, so production
 * builds run `next build --webpack`. Development uses Turbopack without
 * Serwist at all, which keeps `next dev` fast and free of the webpack
 * config that Next 16's Turbopack check rejects.
 */
const withSerwist = withSerwistInit({ swSrc: "src/app/sw.ts", swDest: "public/sw.js" });

export default process.env.NODE_ENV === "production" ? withSerwist(nextConfig) : nextConfig;
