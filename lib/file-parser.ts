import { PDFExtract } from "pdf.js-extract"
import fs from "fs/promises"
import path from "path"

export interface ParsedDocument {
  content: string
  metadata: {
    filename: string
    type: string
    pageCount?: number
    wordCount: number
  }
}

export async function parseFile(filePath: string, filename: string): Promise<ParsedDocument> {
  const ext = path.extname(filename).toLowerCase()

  switch (ext) {
    case ".pdf":
      return parsePDF(filePath, filename)
    case ".txt":
      return parseTXT(filePath, filename)
    case ".csv":
      return parseCSV(filePath, filename)
    default:
      throw new Error(`Unsupported file type: ${ext}`)
  }
}

async function parsePDF(filePath: string, filename: string): Promise<ParsedDocument> {
  const pdfExtract = new PDFExtract()

  return new Promise((resolve, reject) => {
    pdfExtract.extract(filePath, {}, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      const content = data.pages.map((page) => page.content.map((item) => item.str).join(" ")).join("\n\n")

      resolve({
        content,
        metadata: {
          filename,
          type: "pdf",
          pageCount: data.pages.length,
          wordCount: content.split(/\s+/).length,
        },
      })
    })
  })
}

async function parseTXT(filePath: string, filename: string): Promise<ParsedDocument> {
  const content = await fs.readFile(filePath, "utf-8")

  return {
    content,
    metadata: {
      filename,
      type: "txt",
      wordCount: content.split(/\s+/).length,
    },
  }
}

async function parseCSV(filePath: string, filename: string): Promise<ParsedDocument> {
  const content = await fs.readFile(filePath, "utf-8")
  const lines = content.split("\n")
  const headers = lines[0]?.split(",") || []

  // Convert CSV to readable text format
  const textContent = lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(",")
      return headers.map((header, index) => `${header.trim()}: ${values[index]?.trim() || ""}`).join(", ")
    })
    .join("\n")

  return {
    content: `CSV Data:\nHeaders: ${headers.join(", ")}\n\n${textContent}`,
    metadata: {
      filename,
      type: "csv",
      wordCount: textContent.split(/\s+/).length,
    },
  }
}

export function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = []
  const words = text.split(/\s+/)

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ")
    if (chunk.trim()) {
      chunks.push(chunk)
    }
  }

  return chunks
}
