export function getAppOrigin(request: Request) {
  const configured = process.env.BETTER_AUTH_URL?.replace(/\/$/, "")

  if (configured) {
    return configured
  }

  return new URL(request.url).origin
}
