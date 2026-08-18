export function documentStoragePrefix(userId: string, documentId: string) {
  return `documents/${userId}/${documentId}`
}

export function currentPdfKey(storageKey: string) {
  return `${storageKey}/current.pdf`
}

export function versionPdfKey(storageKey: string, version: number) {
  return `${storageKey}/versions/${version}.pdf`
}
