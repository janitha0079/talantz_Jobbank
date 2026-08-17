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

function parseCV(rawText: string): CVData {
  // Clean and normalize text
  const text = rawText.replace(/\f/g, '\n').trim()
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  // Create sections for analysis
  const fullTextLower = text.toLowerCase()

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
  // Strategy 1: Check first line
  if (lines.length > 0) {
    const firstLine = lines[0]
    const wordCount = firstLine.split(/\s+/).length

    if (
      firstLine.length < 70 &&
      wordCount >= 1 &&
      wordCount <= 4 &&
      !firstLine.includes('@') &&
      !firstLine.includes('|') &&
      !firstLine.toLowerCase().match(/^(resume|cv|curriculum|contact|objective|summary)/)
    ) {
      return firstLine
    }
  }

  // Strategy 2: Look for name pattern in first 15 lines
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i]

    // Skip if contains special chars or looks like a section header
    if (line.includes('@') || line.match(/^[\s\-*•]+/)) continue

    const words = line.split(/\s+/)

    // Name is typically 2-4 words, starts with capital letter, no numbers
    if (
      words.length >= 2 &&
      words.length <= 4 &&
      line.length < 60 &&
      /^[A-Z]/.test(line) &&
      !line.match(/\d{2,}/) &&
      !line.toLowerCase().match(/(phone|email|linkedin|github|website|location|summary|objective|address)/i)
    ) {
      return line
    }
  }

  return null
}

function extractHeadline(lines: string[], fullText: string): string | null {
  // Job title keywords
  const titleKeywords = [
    'engineer', 'developer', 'programmer', 'manager', 'director', 'analyst',
    'designer', 'architect', 'consultant', 'specialist', 'officer', 'lead',
    'senior', 'junior', 'associate', 'coordinator', 'administrator', 'executive',
    'scientist', 'researcher', 'product', 'project', 'business', 'data',
    'software', 'web', 'mobile', 'full stack', 'devops', 'qa', 'tester',
    'architect', 'intern', 'apprentice', 'freelancer', 'contractor', 'consultant'
  ]

  // Look in first 10 lines
  for (let i = 1; i < Math.min(lines.length, 10); i++) {
    const line = lines[i]
    const lowerLine = line.toLowerCase()
    const wordCount = line.split(/\s+/).length

    // Skip certain patterns
    if (
      line.includes('@') ||
      lowerLine.match(/^(phone|email|location|address|linkedin|github|website)/) ||
      wordCount > 8 ||
      line.length > 100
    ) {
      continue
    }

    // Check if contains title keyword
    if (titleKeywords.some(kw => lowerLine.includes(kw))) {
      return line
    }
  }

  return null
}

function extractEmail(text: string): string | null {
  // Match email addresses
  const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)

  if (emailMatches && emailMatches.length > 0) {
    // Return first email (usually the personal one)
    return emailMatches[0].toLowerCase()
  }

  return null
}

function extractPhone(text: string): string | null {
  // Multiple phone number patterns
  const patterns = [
    // US format: (123) 456-7890 or 123-456-7890 or 123.456.7890
    /\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/,
    // International format: +1 123 456 7890
    /\+[0-9]{1,3}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}/,
    // UK/other: 10+ digits
    /[0-9]{3}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{1,4}/,
    // Simple 10 digit
    /\b[0-9]{10}\b/,
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
  const lowerText = fullText.toLowerCase()

  // Strategy 1: Look for explicit location label
  const locationMatch = lowerText.match(
    /(?:^|\n)\s*(?:location|based in|located in|based|city|address|place)[:\s]+([^\n]+)/i,
  )
  if (locationMatch) {
    const loc = locationMatch[1].trim()
    if (loc.length < 80 && !loc.includes('@')) {
      return loc
    }
  }

  // Strategy 2: Look for city, state/country patterns
  const cityStateMatches = fullText.match(/\b([A-Z][a-zA-z]+),\s*([A-Z]{2}|[A-Z][a-zA-z]+)\b/g)
  if (cityStateMatches && cityStateMatches.length > 0) {
    // Filter out common false positives
    for (const match of cityStateMatches) {
      if (match.length < 50 && !match.match(/^(Email|Phone|CONTACT|PROFILE)/i)) {
        return match
      }
    }
  }

  // Strategy 3: Look in first 30 lines for location line
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const line = lines[i].toLowerCase()

    if (line.match(/^(?:location|city|based|address)/i)) {
      // Check next lines
      for (let j = i + 1; j < Math.min(lines.length, i + 3); j++) {
        const potentialLoc = lines[j].trim()
        if (potentialLoc.length > 2 && potentialLoc.length < 80 && !potentialLoc.includes('@')) {
          return potentialLoc
        }
      }
    }
  }

  return null
}

function extractSummary(lines: string[], fullText: string): string | null {
  const lowerText = fullText.toLowerCase()

  // Look for summary/objective/about section
  const summaryHeaders = ['summary', 'objective', 'professional summary', 'about', 'profile', 'introduction', 'executive summary']

  let summaryStartIdx = -1

  for (let i = 0; i < lines.length; i++) {
    const lowerLine = lines[i].toLowerCase()

    if (summaryHeaders.some(header => lowerLine.includes(header) && lowerLine.trim().length < 50)) {
      summaryStartIdx = i + 1
      break
    }
  }

  if (summaryStartIdx > 0) {
    const summaryLines: string[] = []

    for (let i = summaryStartIdx; i < lines.length; i++) {
      const line = lines[i]
      const lowerLine = line.toLowerCase()

      // Stop at next section
      if (
        lowerLine.match(/^(experience|employment|work history|skills|education|certifications|awards|languages|technical|projects)/i)
      ) {
        break
      }

      // Skip empty lines and bullet points
      if (line.trim().length === 0 || line.match(/^[\s\-*•]/)) {
        continue
      }

      // Skip all caps lines (usually headers)
      if (/^[A-Z\s]+$/.test(line) || line.length > 250) {
        continue
      }

      summaryLines.push(line)

      // Limit to reasonable length
      if (summaryLines.join(' ').length > 400) {
        break
      }
    }

    const summary = summaryLines.join(' ').trim()
    if (summary.length > 20 && summary.length < 500) {
      return summary
    }
  }

  // Fallback: try first meaningful paragraph (after name/headline)
  if (lines.length > 3) {
    let potential = ''

    for (let i = 2; i < Math.min(lines.length, 8); i++) {
      const line = lines[i]

      if (
        line.length > 20 &&
        line.length < 200 &&
        !line.toLowerCase().match(/^(phone|email|location|linkedin|github)/i) &&
        !line.includes('@') &&
        !/^[\-*•]/.test(line)
      ) {
        potential += line + ' '
      }
    }

    if (potential.length > 30 && potential.length < 400) {
      return potential.trim()
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

      // Log extracted data for debugging
      console.log('[parse-cv] Extracted:', {
        fileName: file.name,
        fileSize: file.size,
        extractedText: text.substring(0, 500),
        parsed: data,
      })

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
