import "server-only"

import { S3Client } from "@aws-sdk/client-s3"

import { getR2Env } from "@/lib/r2/env"

const globalForR2 = globalThis as unknown as {
  r2Client: S3Client | undefined
}

export function getR2Client(): S3Client {
  if (globalForR2.r2Client) {
    return globalForR2.r2Client
  }

  const { accountId, accessKeyId, secretAccessKey } = getR2Env()

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    // AWS SDK v3 signs checksum headers by default; browsers will not send them
    // on a presigned PUT, so R2 would reject the upload.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  })

  if (process.env.NODE_ENV !== "production") {
    globalForR2.r2Client = client
  }

  return client
}

export function getR2BucketName(): string {
  return getR2Env().bucketName
}
