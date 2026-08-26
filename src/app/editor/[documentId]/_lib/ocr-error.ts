export class OcrError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OcrError"
  }
}
