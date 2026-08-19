import { revalidateTag } from "next/cache"

export function userDocumentsTag(userId: string) {
  return `user-documents:${userId}`
}

export function revalidateUserDocuments(userId: string) {
  revalidateTag(userDocumentsTag(userId), { expire: 0 })
}
