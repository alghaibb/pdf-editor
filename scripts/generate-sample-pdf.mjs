import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const destinationDir = join(root, "public/samples")
const destination = join(destinationDir, "sample-invoice.pdf")

function escapePdfText(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)")
}

function buildPdf() {
  const lines = [
    "PDF Editor sample",
    "Invoice Date: 15 August 2026",
    "Click the date above and change it.",
    "Then use Export and reload to confirm the edit stayed in the PDF.",
  ]

  const contentStream = [
    "BT",
    "/F1 22 Tf",
    "72 720 Td",
    `(${escapePdfText(lines[0])}) Tj`,
    "/F1 13 Tf",
    "0 -36 Td",
    `(${escapePdfText(lines[1])}) Tj`,
    "0 -24 Td",
    `(${escapePdfText(lines[2])}) Tj`,
    "0 -20 Td",
    `(${escapePdfText(lines[3])}) Tj`,
    "ET",
  ].join("\n")

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ]

  let pdf = "%PDF-1.4\n"
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = Buffer.byteLength(pdf, "utf8")
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += "0000000000 65535 f \n"
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return pdf
}

mkdirSync(destinationDir, { recursive: true })
writeFileSync(destination, buildPdf(), "utf8")
console.info(`Wrote sample PDF to ${destination}`)
