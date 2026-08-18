/**
 * pg v8 treats sslmode=require as verify-full and warns about a future
 * semantic change. Neon and most hosted Postgres URLs still ship `require`.
 * Pin verify-full so the current (stronger) behavior is explicit.
 */
export function withVerifiedSsl(connectionString: string): string {
  const url = new URL(connectionString)
  const sslMode = url.searchParams.get("sslmode")

  if (
    sslMode === null ||
    sslMode === "prefer" ||
    sslMode === "require" ||
    sslMode === "verify-ca"
  ) {
    url.searchParams.set("sslmode", "verify-full")
  }

  return url.toString()
}
