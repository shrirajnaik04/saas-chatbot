declare module 'pdf-parse' {
  interface PDFParseResult {
    numpages: number
    numrender: number
    info: any
    metadata: any
    version: string
    text: string
  }
  function pdf(dataBuffer: Buffer | Uint8Array): Promise<PDFParseResult>
  export default pdf
}
