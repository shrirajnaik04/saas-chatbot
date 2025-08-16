import fs from "fs/promises"
import path from "path"
// Load pdf-parse dynamically to avoid build-time issues

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
  // Ensure we use the ext from the provided filename, but always read from filePath we just wrote
  const ext = path.extname(filename || filePath).toLowerCase()

  switch (ext) {
    case ".pdf":
      try {
        return await parsePDF(filePath, filename)
      } catch (e: any) {
        throw new Error(`Failed to parse PDF: ${e?.message || e}`)
      }
    case ".txt":
      try {
        return await parseTXT(filePath, filename)
      } catch (e: any) {
        throw new Error(`Failed to parse TXT: ${e?.message || e}`)
      }
    case ".csv":
      try {
        return await parseCSV(filePath, filename)
      } catch (e: any) {
        throw new Error(`Failed to parse CSV: ${e?.message || e}`)
      }
    default:
      throw new Error(`Unsupported file type: ${ext}`)
  }
}

// New: Parse directly from an in-memory Buffer to avoid any filesystem path issues
export async function parseFileFromBuffer(data: Buffer, filename: string): Promise<ParsedDocument> {
  const ext = path.extname(path.basename(filename || "")).toLowerCase()
  switch (ext) {
    case ".pdf": {
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js" as any)).default as any
      const parsed = await pdfParse(data)
      const content = parsed.text || ""
      if (!content.trim()) throw new Error("No extractable text found in PDF")
      return {
        content,
        metadata: {
          filename,
          type: "pdf",
          pageCount: (parsed.numpages as number) || undefined,
          wordCount: content.split(/\s+/).length,
        },
      }
    }
    case ".txt": {
      const content = data.toString("utf-8")
      if (!content.trim()) throw new Error("TXT file is empty")
      return {
        content,
        metadata: {
          filename,
          type: "txt",
          wordCount: content.split(/\s+/).length,
        },
      }
    }
    case ".csv": {
      const raw = data.toString("utf-8")
      const lines = raw.split("\n")
      const headers = lines[0]?.split(",") || []
      if (!headers.length) throw new Error("CSV appears to have no headers or content")
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
    default:
      throw new Error(`Unsupported file type: ${ext}`)
  }
}

async function parsePDF(filePath: string, filename: string): Promise<ParsedDocument> {
  const data = await fs.readFile(filePath)
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js" as any)).default as any
  const parsed = await pdfParse(data)
  const content = parsed.text || ""
  if (!content.trim()) {
    throw new Error("No extractable text found in PDF")
  }
  return {
    content,
    metadata: {
      filename,
      type: "pdf",
      pageCount: (parsed.numpages as number) || undefined,
      wordCount: content.split(/\s+/).length,
    },
  }
}

async function parseTXT(filePath: string, filename: string): Promise<ParsedDocument> {
  const content = await fs.readFile(filePath, "utf-8")
  if (!content.trim()) {
    throw new Error("TXT file is empty")
  }

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
  if (!headers.length) {
    throw new Error("CSV appears to have no headers or content")
  }

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
