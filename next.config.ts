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
    return [
      {
        source: "/lib/webviewer/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
}

export default nextConfig
