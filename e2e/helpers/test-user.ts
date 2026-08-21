import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3"
import { Pool } from "pg"

import { withVerifiedSsl } from "../../src/lib/database-url"

// The app's prisma/r2 modules import "server-only" (which throws outside a
// React Server environment) and the generated Prisma client is ESM-only,
// which Playwright's CJS transpiler cannot load. The harness needs three
// trivial queries, so it talks to Postgres directly through pg.
let pool: Pool | null = null

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error("DATABASE_URL is required to run E2E tests.")
    }

    pool = new Pool({
      connectionString: withVerifiedSsl(connectionString),
      max: 2,
    })
  }

  return pool
}

type TestUser = {
  email: string
  password: string
  name: string
}

/**
 * Signs up through the real Better Auth endpoint (so password hashing and
 * account rows are exactly what production creates), then marks the email
 * verified directly since no OTP email can be read in a test run.
 */
export async function createVerifiedUser(baseURL: string, user: TestUser) {
  const response = await fetch(`${baseURL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Better Auth rejects cross-origin-less requests for CSRF protection.
      Origin: baseURL,
    },
    body: JSON.stringify(user),
  })

  if (!response.ok) {
    throw new Error(
      `E2E sign-up failed: ${response.status} ${await response.text()}`
    )
  }

  await getPool().query(
    'UPDATE "user" SET "emailVerified" = true WHERE "email" = $1',
    [user.email]
  )
}

async function deleteR2Prefixes(prefixes: string[]) {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET_NAME

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    console.warn("R2 is not configured; skipping E2E storage cleanup.")
    return
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  })

  for (const prefix of prefixes) {
    const listed = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix })
    )
    const keys = (listed.Contents ?? [])
      .map((object) => object.Key)
      .filter((key): key is string => Boolean(key))

    if (keys.length === 0) {
      continue
    }

    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: keys.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    )
  }
}

/** Removes the test user, their documents (cascade), and their R2 files. */
export async function deleteUserAndFiles(email: string) {
  const db = getPool()

  const userResult = await db.query<{ id: string }>(
    'SELECT "id" FROM "user" WHERE "email" = $1',
    [email]
  )
  const userId = userResult.rows[0]?.id

  if (!userId) {
    return
  }

  const documentsResult = await db.query<{ storageKey: string }>(
    'SELECT "storageKey" FROM "document" WHERE "userId" = $1',
    [userId]
  )

  try {
    await deleteR2Prefixes(
      documentsResult.rows.map((row) => `${row.storageKey}/`)
    )
  } catch (error) {
    console.error("E2E storage cleanup failed:", error)
  }

  await db.query('DELETE FROM "user" WHERE "id" = $1', [userId])
}

export async function disconnectTestDb() {
  if (pool) {
    await pool.end()
    pool = null
  }
}
