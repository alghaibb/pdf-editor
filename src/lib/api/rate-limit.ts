import "server-only"

import { apiError } from "@/lib/api/response"

type Bucket = {
  count: number
  resetAt: number
}

/**
 * Fixed-window limiter held in instance memory. On serverless this is
 * per-instance rather than global, so it is a abuse brake, not a precise
 * quota — good enough to stop a script hammering the write endpoints
 * without adding a Redis dependency.
 */
const buckets = new Map<string, Bucket>()

const MAX_TRACKED_BUCKETS = 10_000

function evictExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key)
    }
  }
}

export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_BUCKETS) {
      evictExpiredBuckets(now)
    }

    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  bucket.count += 1
  return bucket.count > limit
}

export function rateLimitedResponse() {
  return apiError(
    "RATE_LIMITED",
    "Too many requests. Try again in a moment.",
    429
  )
}
