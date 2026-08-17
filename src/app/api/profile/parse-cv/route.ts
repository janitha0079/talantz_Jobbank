import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

async function extractTextFromBuffer(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  const lowerFileName = fileName.toLowerCase()

  if (mimeType === 'application/pdf' || lowerFileName.endsWith('.pdf')) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse')
      const data = await pdfParse(buffer)
      return data.text || ''
    } catch (err) {
      console.error('PDF parse error:', err)
      throw new Error('Failed to parse PDF file')
    }
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    lowerFileName.endsWith('.docx') ||
    lowerFileName.endsWith('.doc')
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value || ''
    } catch (err) {
      console.error('DOCX parse error:', err)
      throw new Error('Failed to parse Word document')
    }
  }

  if (mimeType === 'text/plain' || lowerFileName.endsWith('.txt')) {
    return buffer.toString('utf-8')
  }

  throw new Error(`Unsupported file type: ${mimeType || 'unknown'}`)
}

interface CVData {
  fullName: string | null
  headline: string | null
  location: string | null
  phone: string | null
  email: string | null
  summary: string | null
}

function parseCV(text: string): CVData {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  return {
    fullName: extractName(lines, text),
    headline: extractHeadline(lines, text),
    email: extractEmail(text),
    phone: extractPhone(text),
    location: extractLocation(lines, text),
    summary: extractSummary(lines, text),
  }
}

function extractName(lines: string[], fullText: string): string | null {
  // Try first line - usually the name
  if (lines.length > 0) {
    const firstLine = lines[0]
    // Check if first line looks like a name (2-4 words, no special chars except space/hyphen)
    if (firstLine.length < 60 && !firstLine.includes('@') && !firstLine.includes('|')) {
      const wordCount = firstLine.split(/\s+/).length
      if (wordCount >= 1 && wordCount <= 4) {
        // Check it's not a common header
        if (!firstLine.toLowerCase().match(/^(resume|cv|curriculum|contact|objective)/i)) {
          return firstLine
        }
      }
    }
  }

  // Look for name patterns in first 10 lines
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i]
    if (
      line.length < 60 &&
      !line.includes('@') &&
      !line.includes('|') &&
      line.split(/\s+/).length >= 2 &&
      line.split(/\s+/).length <= 4 &&
      /^[A-Z]/.test(line)
    ) {
      return line
    }
  }

  return null
}

function extractHeadline(lines: string[], fullText: string): string | null {
  // Look for job title after name
  for (let i = 1; i < Math.min(lines.length, 8); i++) {
    const line = lines[i]
    const wordCount = line.split(/\s+/).length

    // Job titles are typically 1-5 words, less than 80 chars
    if (
      wordCount >= 1 &&
      wordCount <= 5 &&
      line.length < 80 &&
      !line.includes('@') &&
      !line.toLowerCase().match(/(^[0-9]|phone|email|address|linkedin|github|website)/)
    ) {
      // Check if it looks like a title
      const titleKeywords = ['engineer', 'developer', 'manager', 'analyst', 'designer', 'consultant', 'specialist', 'lead', 'director', 'officer', 'executive', 'architect', 'coordinator', 'associate', 'senior', 'junior', 'intern', 'freelance']
      const lowerLine = line.toLowerCase()
      if (titleKeywords.some(keyword => lowerLine.includes(keyword))) {
        return line
      }
    }
  }

  return null
}

function extractEmail(text: string): string | null {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i)
  return emailMatch ? emailMatch[0].toLowerCase() : null
}

function extractPhone(text: string): string | null {
  // Multiple phone patterns for different formats
  const patterns = [
    /\+?1?\s*\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/,  // (123) 456-7890, +1-123-456-7890, etc
    /\+[0-9]{1,3}\s?[0-9\s\-()]+[0-9]{3,}/,  // International format
    /\b[0-9]{10,}\b/,  // 10+ digit number
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[0].trim()
    }
  }

  return null
}

function extractLocation(lines: string[], fullText: string): string | null {
  // Look for city, state/country patterns
  const locationMatch = fullText.match(
    /(?:location|based in|located in|address|city)[\s:]+([A-Za-z\s,]+?)(?:\n|$|,\s*[A-Z]|,\s*\d)/i,
  )
  if (locationMatch) {
    const location = locationMatch[1].trim()
    if (location.length < 80 && !location.includes('@')) {
      return location
    }
  }

  // Look for "City, State" or "City, Country" patterns
  const cityStateMatch = fullText.match(/\b([A-Z][a-z]+),\s*([A-Z]{2}|[A-Z][a-z]+)\b/)
  if (cityStateMatch) {
    return `${cityStateMatch[1]}, ${cityStateMatch[2]}`
  }

  // Look in first 20 lines for location info
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i].toLowerCase()
    if (line.match(/^(location|city|based|address)/i)) {
      // Next non-empty line might be the location
      for (let j = i + 1; j < Math.min(lines.length, i + 3); j++) {
        const potentialLocation = lines[j].trim()
        if (potentialLocation.length > 0 && potentialLocation.length < 80) {
          return potentialLocation
        }
      }
    }
  }

  return null
}

function extractSummary(lines: string[], fullText: string): string | null {
  // Look for professional summary/objective section
  const summaryKeywords = ['summary', 'objective', 'professional summary', 'about', 'profile']

  for (let i = 0; i < lines.length; i++) {
    const lowerLine = lines[i].toLowerCase()

    if (summaryKeywords.some(keyword => lowerLine.includes(keyword))) {
      // Collect lines after this header until we hit another section
      const summaryLines: string[] = []

      for (let j = i + 1; j < lines.length; j++) {
        const line = lines[j]
        const lowerCaseLine = line.toLowerCase()

        // Stop at next section header
        if (lowerCaseLine.match(/^(experience|education|skills|projects|certifications|awards|languages|references)/i)) {
          break
        }

        // Skip empty lines and section headers
        if (line.trim().length === 0 || /^[*-]\s/.test(line)) {
          continue
        }

        // Skip lines that look like headers
        if (/^[A-Z\s]+$/.test(line) || line.length > 200) {
          continue
        }

        summaryLines.push(line)

        // Limit to reasonable length
        if (summaryLines.join(' ').length > 300) {
          break
        }
      }

      const summary = summaryLines.join(' ').trim()
      if (summary.length > 20 && summary.length < 300) {
        return summary
      }
    }
  }

  // If no explicit summary section, try first paragraph
  if (lines.length > 2) {
    let potentialSummary = ''
    for (let i = 1; i < Math.min(lines.length, 5); i++) {
      if (lines[i].length > 20 && !lines[i].toLowerCase().match(/^(phone|email|location|linkedin)/i)) {
        potentialSummary += lines[i] + ' '
        if (potentialSummary.length > 150) break
      }
    }

    if (potentialSummary.length > 30 && potentialSummary.length < 300) {
      return potentialSummary.trim()
    }
  }

  return null
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

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File is too large (max 10MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      const text = await extractTextFromBuffer(buffer, file.type, file.name)

      if (!text || text.trim().length === 0) {
        return NextResponse.json(
          { error: 'Could not extract text from file. Try a different file.' },
          { status: 400 },
        )
      }

      const data = parseCV(text)
      return NextResponse.json(data)
    } catch (parseErr) {
      console.error('[parse-cv-parse]', parseErr)
      const errorMsg = parseErr instanceof Error ? parseErr.message : 'Failed to parse file'
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }
  } catch (error) {
    console.error('[parse-cv]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process CV' },
      { status: 500 },
    )
  }
}
