"use client"

import dynamic from "next/dynamic"

// Sonner and its icons are not needed for first paint. Load them after
// hydration so the landing page's mobile main thread is not blocked.
export const DeferredToaster = dynamic(
  () => import("@/components/ui/sonner").then((mod) => mod.Toaster),
  { ssr: false }
)
