import "server-only"

import { randomUUID } from "node:crypto"

import prisma from "@/lib/prisma"
import { PDF_MIME_TYPE } from "@/lib/pdf/constants"
import { sanitizeDocumentName } from "@/lib/pdf/name"
import { documentStoragePrefix } from "@/lib/r2/keys"

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
    },
  })
}

export async function markDocumentVersionSaved(input: {
  documentId: string
  userId: string
  version: number
  size: number
}) {
  const result = await prisma.document.updateMany({
    where: {
      id: input.documentId,
      userId: input.userId,
    },
    data: {
      currentVersion: input.version,
      size: input.size,
    },
  })

  if (result.count !== 1) {
    throw new Error("Document could not be updated.")
  }

  const document = await prisma.document.findFirst({
    where: {
      id: input.documentId,
      userId: input.userId,
    },
    select: {
      id: true,
      name: true,
      currentVersion: true,
      size: true,
    },
  })

  if (!document) {
    throw new Error("Document could not be updated.")
  }

  return document
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
