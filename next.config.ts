import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  // Prefetch static shells (loading UI + layouts) so dashboard ↔ editor
  // clicks paint immediately, then stream the private data.
  partialPrefetching: true,
  serverExternalPackages: ["pg"],
  outputFileTracingExcludes: {
    "**/*": [
      "./node_modules/@pdftron/webviewer/**",
      "./public/lib/webviewer/**",
    ],
  },
  async headers() {
    const cacheControl = {
      key: "Cache-Control",
      value: "public, max-age=31536000, immutable",
    } as const

    return [
      {
        source: "/lib/webviewer/:path*",
        headers: [cacheControl],
      },
      // Apryse ships pre-compressed workers named *.br.* and *.gz.*.
      // Content-Encoding lets the browser decode them natively instead of
      // WebViewer inflating them in JS (and fetching each worker twice).
      // Brotli is HTTPS-only: Chrome rejects Content-Encoding: br on HTTP,
      // which would break local `next dev`.
      {
        source: "/lib/webviewer/:path(.*\\.br\\..*)",
        has: [
          {
            type: "header",
            key: "x-forwarded-proto",
            value: "https",
          },
          {
            type: "header",
            key: "accept-encoding",
            value: "(.*br.*)",
          },
        ],
        headers: [
          { key: "Content-Encoding", value: "br" },
          { key: "Vary", value: "Accept-Encoding" },
        ],
      },
      {
        source: "/lib/webviewer/:path(.*\\.gz\\..*)",
        has: [
          {
            type: "header",
            key: "accept-encoding",
            value: "(.*gzip.*)",
          },
        ],
        headers: [
          { key: "Content-Encoding", value: "gzip" },
          { key: "Vary", value: "Accept-Encoding" },
        ],
      },
    ]
  },
}

export default nextConfig
