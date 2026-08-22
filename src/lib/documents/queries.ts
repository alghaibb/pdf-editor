import "server-only"

import { randomUUID } from "node:crypto"
import { cacheLife, cacheTag } from "next/cache"

import prisma from "@/lib/prisma"
import { PDF_MIME_TYPE } from "@/lib/pdf/constants"
import { sanitizeDocumentName } from "@/lib/pdf/name"
import { documentStoragePrefix } from "@/lib/r2/keys"
import { userDocumentsTag } from "@/lib/documents/cache-tags"

export async function createDocumentRecord(input: {
  userId: string
  name: string
}) {
  const name = sanitizeDocumentName(input.name)
  const id = randomUUID()

  return prisma.document.create({
    data: {
      id,
      userId: input.userId,
      name,
      storageKey: documentStoragePrefix(input.userId, id),
      size: 0,
      mimeType: PDF_MIME_TYPE,
      currentVersion: 0,
    },
    select: {
      id: true,
      userId: true,
      name: true,
      storageKey: true,
      size: true,
      mimeType: true,
      currentVersion: true,
    },
  })
}

export async function getOwnedDocument(documentId: string, userId: string) {
  return prisma.document.findFirst({
    where: {
      id: documentId,
      userId,
    },
  })
}

export async function listUserDocuments(userId: string) {
  "use cache"
  cacheLife("hours")
  cacheTag(userDocumentsTag(userId))

  return prisma.document.findMany({
    where: {
      userId,
      currentVersion: {
        gt: 0,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      name: true,
      updatedAt: true,
    },
  })
}

export async function markDocumentVersionSaved(input: {
  documentId: string
  userId: string
  version: number
  size: number
}) {
  try {
    // The ownership-scoped update runs first: if the document is not owned it
    // throws and rolls back the version row. Upsert tolerates a duplicate
    // completion request for the same version.
    const [document] = await prisma.$transaction([
      prisma.document.update({
        where: {
          id: input.documentId,
          userId: input.userId,
        },
        data: {
          currentVersion: input.version,
          size: input.size,
        },
        select: {
          id: true,
          name: true,
          currentVersion: true,
          size: true,
        },
      }),
      prisma.documentVersion.upsert({
        where: {
          documentId_version: {
            documentId: input.documentId,
            version: input.version,
          },
        },
        create: {
          documentId: input.documentId,
          version: input.version,
          size: input.size,
        },
        update: {
          size: input.size,
        },
      }),
    ])

    return document
  } catch (error) {
    console.error("Failed to mark document version saved:", error)
    throw new Error("Document could not be updated.")
  }
}

export async function listDocumentVersions(
  documentId: string,
  userId: string,
  options: {
    /** Return only versions older than this version number. */
    cursor?: number
    /** Callers pass pageSize + 1 to detect whether another page exists. */
    take: number
  }
) {
  return prisma.documentVersion.findMany({
    where: {
      documentId,
      document: {
        userId,
      },
      ...(options.cursor !== undefined
        ? { version: { lt: options.cursor } }
        : {}),
    },
    orderBy: {
      version: "desc",
    },
    take: options.take,
    select: {
      version: true,
      size: true,
      createdAt: true,
    },
  })
}

export async function getDocumentVersion(documentId: string, version: number) {
  return prisma.documentVersion.findUnique({
    where: {
      documentId_version: {
        documentId,
        version,
      },
    },
    select: {
      version: true,
      size: true,
    },
  })
}

export async function findPrunableVersions(documentId: string, keep: number) {
  return prisma.documentVersion.findMany({
    where: {
      documentId,
    },
    orderBy: {
      version: "desc",
    },
    skip: keep,
    select: {
      version: true,
    },
  })
}

export async function deleteVersionRecords(
  documentId: string,
  versions: number[]
) {
  await prisma.documentVersion.deleteMany({
    where: {
      documentId,
      version: {
        in: versions,
      },
    },
  })
}

export async function renameOwnedDocument(input: {
  documentId: string
  userId: string
  name: string
}) {
  const document = await getOwnedDocument(input.documentId, input.userId)

  if (!document) {
    return null
  }

  const name = sanitizeDocumentName(input.name)

  if (name === document.name) {
    return document
  }

  const result = await prisma.document.updateMany({
    where: {
      id: input.documentId,
      userId: input.userId,
    },
    data: {
      name,
      // Preserve last-edited order so a rename does not jump the file to the top.
      updatedAt: document.updatedAt,
    },
  })

  if (result.count !== 1) {
    throw new Error("Document could not be renamed.")
  }

  return {
    ...document,
    name,
  }
}

export async function createDocumentShare(input: {
  documentId: string
  token: string
  expiresAt: Date
}) {
  return prisma.documentShare.create({
    data: {
      documentId: input.documentId,
      token: input.token,
      expiresAt: input.expiresAt,
    },
    select: {
      token: true,
      expiresAt: true,
    },
  })
}

export async function getShareByToken(token: string) {
  return prisma.documentShare.findUnique({
    where: {
      token,
    },
    select: {
      id: true,
      expiresAt: true,
      document: {
        select: {
          id: true,
          name: true,
          storageKey: true,
          currentVersion: true,
        },
      },
    },
  })
}

export async function getSharePageState(token: string) {
  const share = await getShareByToken(token)

  if (!share || share.document.currentVersion < 1) {
    return null
  }

  return {
    name: share.document.name,
    expiresAt: share.expiresAt,
    isExpired: share.expiresAt.getTime() <= Date.now(),
  }
}

export async function deleteOwnedDocument(input: {
  documentId: string
  userId: string
}) {
  const result = await prisma.document.deleteMany({
    where: {
      id: input.documentId,
      userId: input.userId,
    },
  })

  if (result.count !== 1) {
    throw new Error("Document could not be deleted.")
  }
}
