import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  serverExternalPackages: ["@pdftron/webviewer", "pg", "pg-cloudflare"],
  // Next's file tracer only copies pg-cloudflare's Node stub. OpenNext's
  // Worker bundle needs the workerd entry (dist/index.js, esm/index.mjs).
  outputFileTracingIncludes: {
    "**/*": [
      "./node_modules/pg-cloudflare/dist/**",
      "./node_modules/pg-cloudflare/esm/**",
    ],
  },
}

export default nextConfig

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"

initOpenNextCloudflareForDev()
