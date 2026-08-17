import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'

async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const PdfParse = await import('pdf-parse/lib/pdf-parse.js')
    const pdfBuffer = await readFile(filePath)
    const data = await PdfParse.default(pdfBuffer)
    return data.text
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
    const mammoth = await import('mammoth')
    const buffer = await readFile(filePath)
    const result = await mammoth.default.extractRawText({ buffer })
    return result.value
  }

  if (mimeType === 'text/plain') {
    const buffer = await readFile(filePath)
    return buffer.toString('utf-8')
  }

  throw new Error(`Unsupported file type: ${mimeType}`)
}

function parseCV(text: string) {
  const lines = text.split('\n').filter(l => l.trim())
  const fullText = text.toLowerCase()

  // Simple extraction patterns
  const fullName = extractFullName(lines)
  const headline = extractHeadline(lines)
  const location = extractLocation(lines)
  const phone = extractPhone(text)
  const email = extractEmail(text)
  const summary = extractSummary(lines)

  return {
    fullName,
    headline,
    location,
    phone,
    email,
    summary,
  }
}

function extractFullName(lines: string[]): string | null {
  // Usually first non-empty line is the name
  if (lines.length > 0) {
    const firstLine = lines[0].trim()
    if (firstLine.length < 100 && !firstLine.includes('@')) {
      return firstLine
    }
  }
  return null
}

function extractHeadline(lines: string[]): string | null {
  // Look for job title pattern (usually 2-3 words, after name)
  for (let i = 1; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim()
    const words = line.split(' ').length
    if (words >= 1 && words <= 5 && line.length < 100 && !line.includes('@')) {
      return line
    }
  }
  return null
}

function extractLocation(lines: string[]): string | null {
  // Look for city, state/country pattern
  const locationPatterns = [
    /(?:^|,\s*)(San Francisco|Los Angeles|New York|London|Toronto|Sydney|[A-Z][a-z]+,?\s*[A-Z]{2})/i,
    /(?:based in|located in)\s+([A-Za-z\s,]+)/i,
  ]

  const fullText = lines.join(' ')
  for (const pattern of locationPatterns) {
    const match = fullText.match(pattern)
    if (match) {
      return match[1]?.trim()
    }
  }
  return null
}

function extractPhone(text: string): string | null {
  // Match phone patterns
  const phonePattern = /(?:\+\d{1,3}[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/
  const match = text.match(phonePattern)
  return match ? match[0]?.trim() : null
}

function extractEmail(text: string): string | null {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  const match = text.match(emailPattern)
  return match ? match[0] : null
}

function extractSummary(lines: string[]): string | null {
  // Look for professional summary or objective section
  let inSummary = false
  const summaryLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()

    if (line.includes('summary') || line.includes('objective') || line.includes('about')) {
      inSummary = true
      continue
    }

    if (inSummary) {
      if (line.includes('experience') || line.includes('education') || line.includes('skills')) {
        break
      }

      const trimmed = lines[i].trim()
      if (trimmed && !trimmed.match(/^[A-Z\s]+$/)) {
        summaryLines.push(trimmed)
      }

      if (summaryLines.join(' ').length > 300) {
        break
      }
    }
  }

  const summary = summaryLines.join(' ').trim()
  return summary.length > 20 ? summary : null
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const tempPath = join(tmpdir(), `cv-${randomBytes(8).toString('hex')}`)

    await writeFile(tempPath, Buffer.from(buffer))

    try {
      const text = await extractTextFromFile(tempPath, file.type)
      const data = parseCV(text)

      return NextResponse.json(data)
    } finally {
      await unlink(tempPath).catch(() => {})
    }
  } catch (error) {
    console.error('[parse-cv]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse CV' },
      { status: 400 },
    )
  }
}
