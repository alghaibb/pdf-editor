import { cpSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const source = join(root, "node_modules/@pdftron/webviewer/public")
const destination = join(root, "public/lib/webviewer")

mkdirSync(destination, { recursive: true })
cpSync(source, destination, { recursive: true })

console.info(`Copied WebViewer assets to ${destination}`)
