import "server-only"

import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { PDF_MIME_TYPE } from "@/lib/pdf/constants"
import { asciiContentDispositionName } from "@/lib/pdf/name"
import { hasPdfMagic } from "@/lib/pdf/validate"
import { getR2BucketName, getR2Client } from "@/lib/r2/client"
import { currentPdfKey } from "@/lib/r2/keys"

const UPLOAD_URL_EXPIRES_IN_SECONDS = 15 * 60
const DOWNLOAD_URL_EXPIRES_IN_SECONDS = 10 * 60

export async function createPdfUploadUrl(key: string, size: number) {
  const client = getR2Client()
  const command = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: key,
    ContentType: PDF_MIME_TYPE,
    ContentLength: size,
  })

  return getSignedUrl(client, command, {
    expiresIn: UPLOAD_URL_EXPIRES_IN_SECONDS,
  })
}

export async function createPdfDownloadUrl(key: string, fileName: string) {
  const client = getR2Client()
  const command = new GetObjectCommand({
    Bucket: getR2BucketName(),
    Key: key,
    ResponseContentType: PDF_MIME_TYPE,
    ResponseContentDisposition: `inline; filename="${asciiContentDispositionName(fileName)}"`,
  })

  return getSignedUrl(client, command, {
    expiresIn: DOWNLOAD_URL_EXPIRES_IN_SECONDS,
  })
}

export async function createCurrentPdfDownloadUrl(
  storageKey: string,
  fileName: string
) {
  return createPdfDownloadUrl(currentPdfKey(storageKey), fileName)
}

export async function verifyStoredPdf(key: string, expectedSize: number) {
  const client = getR2Client()
  const bucket = getR2BucketName()

  const head = await client.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )

  if (head.ContentLength !== expectedSize) {
    throw new Error("Stored PDF size does not match the uploaded file.")
  }

  const object = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: "bytes=0-4",
    })
  )

  const headerBytes = await object.Body?.transformToByteArray()

  if (!headerBytes || !hasPdfMagic(headerBytes)) {
    throw new Error("Stored object is not a PDF.")
  }
}

export async function promoteVersionToCurrent(
  storageKey: string,
  versionKey: string
) {
  const client = getR2Client()
  const bucket = getR2BucketName()
  const destinationKey = currentPdfKey(storageKey)

  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: encodeURI(`${bucket}/${versionKey}`),
      Key: destinationKey,
      ContentType: PDF_MIME_TYPE,
      MetadataDirective: "REPLACE",
    })
  )
}

export async function deleteDocumentObjects(
  storageKey: string,
  userId: string
) {
  const expectedPrefix = `documents/${userId}/`

  if (
    !storageKey.startsWith(expectedPrefix) ||
    storageKey.includes("..") ||
    storageKey.endsWith("/")
  ) {
    throw new Error("Invalid storage key.")
  }

  const prefix = `${storageKey}/`
  const client = getR2Client()
  const bucket = getR2BucketName()
  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )

    for (const object of listed.Contents ?? []) {
      if (object.Key) {
        keys.push(object.Key)
      }
    }

    continuationToken = listed.IsTruncated
      ? listed.NextContinuationToken
      : undefined
  } while (continuationToken)

  const chunkSize = 1000

  for (let index = 0; index < keys.length; index += chunkSize) {
    const chunk = keys.slice(index, index + chunkSize)
    const result = await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    )

    if (result.Errors && result.Errors.length > 0) {
      console.error("Failed to delete some R2 objects:", result.Errors)
      throw new Error("Could not delete all stored PDF files.")
    }
  }
}
