import "server-only"

export class R2ConfigError extends Error {
  constructor() {
    super("R2 is not configured.")
    this.name = "R2ConfigError"
  }
}

export type R2Env = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
}

export function getR2Env(): R2Env {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucketName = process.env.R2_BUCKET_NAME

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new R2ConfigError()
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName }
}

export function getMissingR2EnvNames() {
  const required = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
  ] as const

  return required.filter((name) => {
    const value = process.env[name]?.trim()
    return !value
  })
}

export function isR2Configured() {
  return getMissingR2EnvNames().length === 0
}
