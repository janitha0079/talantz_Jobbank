import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { db } from '@/lib/db'
import { CertificationValidationInput, CertificationValidationResult, getCertificationHeuristicValidation } from '@/lib/certifications'
import { computeJobMatch } from '@/lib/matching'

// Lazy init — avoids crash at build time when ANTHROPIC_API_KEY is not set
let _client: Anthropic | null = null
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
  return _client
}

const MODEL = 'claude-opus-4-5'
const PROMPT_VERSION = 'v1'

// ── Usage logger ─────────────────────────────────────────────────────

async function logUsage(opts: {
  functionName: string
  userId?: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  success: boolean
  error?: string
}) {
  await db.aiUsageLog.create({
    data: {
      functionName: opts.functionName,
      promptVersion: PROMPT_VERSION,
      userId: opts.userId,
      inputTokens: opts.inputTokens,
      outputTokens: opts.outputTokens,
      latencyMs: opts.latencyMs,
      success: opts.success,
      errorMessage: opts.error,
    },
  }).catch(() => {})
}

// ── Base caller with logging + error handling ─────────────────────────

async function callClaude(opts: {
  functionName: string
  userId?: string
  system: string
  user: string
  maxTokens?: number
}): Promise<string> {
  const start = Date.now()
  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: [{ role: 'user', content: opts.user }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    await logUsage({
      functionName: opts.functionName,
      userId: opts.userId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs: Date.now() - start,
      success: true,
    })

    return text
  } catch (err: any) {
    await logUsage({
      functionName: opts.functionName,
      userId: opts.userId,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - start,
      success: false,
      error: err.message,
    })
    throw err
  }
}

// ── 1. Parse LinkedIn Profile ─────────────────────────────────────────

const LinkedInProfileSchema = z.object({
  fullName: z.string(),
  headline: z.string(),
  summary: z.string().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()),
  experiences: z.array(z.object({
    title: z.string(),
    company: z.string(),
    location: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isCurrent: z.boolean(),
    description: z.string().optional(),
  })),
  educations: z.array(z.object({
    institution: z.string(),
    degree: z.string().optional(),
    fieldOfStudy: z.string().optional(),
    startYear: z.number().optional(),
    endYear: z.number().optional(),
  })),
})

export type LinkedInProfileData = z.infer<typeof LinkedInProfileSchema>

export async function parseLinkedInProfile(
  rawProfile: Record<string, unknown>,
  userId?: string,
): Promise<LinkedInProfileData> {
  const text = await callClaude({
    functionName: 'parseLinkedInProfile',
    userId,
    maxTokens: 2048,
    system: `You are a structured data extractor. Given a raw LinkedIn OAuth profile JSON,
extract key information and return ONLY a valid JSON object matching the schema.
No preamble, no markdown, no explanation — pure JSON only.`,
    user: `Extract from this LinkedIn profile JSON and return structured JSON:\n\n${JSON.stringify(rawProfile, null, 2)}`,
  })

  const cleaned = text.replace(/```json|```/g, '').trim()
  const parsed = LinkedInProfileSchema.safeParse(JSON.parse(cleaned))
  if (!parsed.success) throw new Error('LinkedIn parse schema mismatch')
  return parsed.data
}

// ── 2. Parse CV Document ──────────────────────────────────────────────

export async function parseCvDocument(
  cvText: string,
  userId?: string,
): Promise<LinkedInProfileData> {
  const text = await callClaude({
    functionName: 'parseCvDocument',
    userId,
    maxTokens: 2048,
    system: `You are a CV/resume parser. Extract structured profile data from the provided CV text.
Return ONLY a valid JSON object. No preamble, no markdown, pure JSON only.`,
    user: `Parse this CV and return structured JSON:\n\n${cvText.slice(0, 8000)}`,
  })

  const cleaned = text.replace(/```json|```/g, '').trim()
  const parsed = LinkedInProfileSchema.safeParse(JSON.parse(cleaned))
  if (!parsed.success) throw new Error('CV parse schema mismatch')
  return parsed.data
}

// ── 3. Enhance Bullet Point ───────────────────────────────────────────

export async function enhanceBulletPoint(
  bullet: string,
  context: { title: string; company: string },
  userId?: string,
): Promise<string[]> {
  const text = await callClaude({
    functionName: 'enhanceBulletPoint',
    userId,
    maxTokens: 512,
    system: `You are a professional CV writer specialising in tech roles in Sri Lanka.
Rewrite the given bullet point into 3 stronger alternatives using action verbs, specificity, and measurable impact.
Return ONLY a JSON array of 3 strings. No preamble, pure JSON.`,
    user: `Role: ${context.title} at ${context.company}\n\nOriginal bullet: "${bullet}"\n\nReturn 3 improved versions as a JSON array.`,
  })

  const cleaned = text.replace(/```json|```/g, '').trim()
  const arr = JSON.parse(cleaned)
  if (!Array.isArray(arr)) throw new Error('Expected array')
  return arr.slice(0, 3)
}

// ── 4. Generate Job Description ───────────────────────────────────────

export async function generateJobDescription(opts: {
  title: string
  company: string
  industry: string
  requirements: string[]
  workMode: string
  location?: string
  userId?: string
}): Promise<{ description: string; checkedInclusive: boolean }> {
  const text = await callClaude({
    functionName: 'generateJobDescription',
    userId: opts.userId,
    maxTokens: 2048,
    system: `You are an expert recruiter and copywriter for a Sri Lankan job platform.
Write compelling, inclusive job descriptions. Return ONLY a JSON object with keys:
"description" (markdown string) and "checkedInclusive" (boolean — true if the description avoids exclusionary language).
No preamble, pure JSON.`,
    user: `Generate a job description for:
Title: ${opts.title}
Company: ${opts.company}
Industry: ${opts.industry}
Work mode: ${opts.workMode}
Location: ${opts.location ?? 'Sri Lanka'}
Key requirements: ${opts.requirements.join(', ')}`,
  })

  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

// ── 5. Score Application Match ────────────────────────────────────────

const MatchScoreSchema = z.object({
  score: z.number().min(0).max(100),
  breakdown: z.object({
    skills: z.number(),
    experience: z.number(),
    education: z.number(),
    location: z.number(),
  }),
  skillsMatched: z.array(z.string()),
  skillsMissing: z.array(z.string()),
  summary: z.string(),
})

export type MatchScore = z.infer<typeof MatchScoreSchema>

export async function scoreApplicationMatch(opts: {
  seekerId: string
  jobId: string
  job: {
    title: string
    description: string
    skillsRequired: string[]
    skillsPreferred: string[]
    experienceMin?: number | null
    educationLevel?: string | null
    location?: string | null
  }
  seeker: {
    headline?: string | null
    summary?: string | null
    skills: string[]
    location?: string | null
    experiences: Array<{ title: string; company: string; description?: string | null }>
    educations: Array<{ degree?: string | null; institution: string }>
  }
  userId?: string
}): Promise<MatchScore> {
  const fallback = computeJobMatch(
    {
      id: opts.jobId,
      title: opts.job.title,
      skillsRequired: opts.job.skillsRequired,
      skillsPreferred: opts.job.skillsPreferred,
      experienceMin: opts.job.experienceMin,
      educationLevel: opts.job.educationLevel,
      location: opts.job.location,
    },
    {
      id: opts.seekerId,
      headline: opts.seeker.headline,
      summary: opts.seeker.summary,
      skills: opts.seeker.skills,
      location: opts.seeker.location,
      experiences: opts.seeker.experiences,
      educations: opts.seeker.educations,
    },
  )

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      score: fallback.score,
      breakdown: {
        skills: fallback.breakdown.skills,
        experience: fallback.breakdown.experience,
        education: fallback.breakdown.education,
        location: fallback.breakdown.location,
      },
      skillsMatched: fallback.skillsMatched,
      skillsMissing: fallback.skillsMissing,
      summary: fallback.summary,
    }
  }

  const text = await callClaude({
    functionName: 'scoreApplicationMatch',
    userId: opts.userId,
    maxTokens: 1024,
    system: `You are a talent-matching AI. Analyse a job listing and candidate profile,
then return a match score and breakdown as JSON. Return ONLY valid JSON, no preamble.`,
    user: `Score this candidate against this job.

JOB:
Title: ${opts.job.title}
Required skills: ${opts.job.skillsRequired.join(', ')}
Preferred skills: ${opts.job.skillsPreferred.join(', ')}
Min experience: ${opts.job.experienceMin ?? 'not specified'} years
Education: ${opts.job.educationLevel ?? 'not specified'}
Location: ${opts.job.location ?? 'Sri Lanka'}

CANDIDATE:
Headline: ${opts.seeker.headline ?? 'N/A'}
Summary: ${(opts.seeker.summary ?? '').slice(0, 500)}
Skills: ${opts.seeker.skills.join(', ')}
Location: ${opts.seeker.location ?? 'not specified'}
Experience: ${opts.seeker.experiences.map((e) => `${e.title} at ${e.company}`).join('; ')}
Education: ${opts.seeker.educations.map((e) => `${e.degree ?? 'Degree'} from ${e.institution}`).join('; ')}

Return JSON: { score (0-100), breakdown: { skills, experience, education, location (each 0-100) }, skillsMatched: [], skillsMissing: [], summary: "2-sentence summary" }`,
  })

  const cleaned = text.replace(/```json|```/g, '').trim()
  const parsed = MatchScoreSchema.safeParse(JSON.parse(cleaned))
  if (!parsed.success) {
    return {
      score: fallback.score,
      breakdown: {
        skills: fallback.breakdown.skills,
        experience: fallback.breakdown.experience,
        education: fallback.breakdown.education,
        location: fallback.breakdown.location,
      },
      skillsMatched: fallback.skillsMatched,
      skillsMissing: fallback.skillsMissing,
      summary: fallback.summary,
    }
  }

  // Cache the score
  await db.aiMatchScoreCache.upsert({
    where: { seekerId_jobId: { seekerId: opts.seekerId, jobId: opts.jobId } },
    update: {
      score: parsed.data.score,
      breakdown: {
        ...parsed.data.breakdown,
        skillsMatched: parsed.data.skillsMatched,
        skillsMissing: parsed.data.skillsMissing,
      },
      summary: parsed.data.summary,
    },
    create: {
      seekerId: opts.seekerId,
      jobId: opts.jobId,
      score: parsed.data.score,
      breakdown: {
        ...parsed.data.breakdown,
        skillsMatched: parsed.data.skillsMatched,
        skillsMissing: parsed.data.skillsMissing,
      },
      summary: parsed.data.summary,
    },
  }).catch(() => {})

  return parsed.data
}

// ── 6. Generate Screening Summary ────────────────────────────────────

const ScreeningSchema = z.object({
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  recommendation: z.enum(['strong_yes', 'yes', 'maybe', 'no']),
  summary: z.string(),
})

export type ScreeningSummary = z.infer<typeof ScreeningSchema>

export async function generateScreeningSummary(opts: {
  jobTitle: string
  candidateName: string
  matchScore: MatchScore
  applicationId: string
  userId?: string
}): Promise<ScreeningSummary> {
  const text = await callClaude({
    functionName: 'generateScreeningSummary',
    userId: opts.userId,
    maxTokens: 768,
    system: `You are an AI recruitment assistant. Generate a concise screening summary for an employer.
Be objective, factual, and never make assumptions beyond the provided data.
Return ONLY valid JSON, no preamble.`,
    user: `Application screening for: ${opts.jobTitle}
Candidate: ${opts.candidateName}
Match score: ${opts.matchScore.score}/100
Skills matched: ${opts.matchScore.skillsMatched.join(', ')}
Skills missing: ${opts.matchScore.skillsMissing.join(', ')}
Score breakdown: ${JSON.stringify(opts.matchScore.breakdown)}
AI summary: ${opts.matchScore.summary}

Return JSON: { strengths: string[], gaps: string[], recommendation: "strong_yes"|"yes"|"maybe"|"no", summary: "3-sentence employer-facing summary" }`,
  })

  const cleaned = text.replace(/```json|```/g, '').trim()
  const parsed = ScreeningSchema.safeParse(JSON.parse(cleaned))
  if (!parsed.success) throw new Error('Screening schema mismatch')
  return parsed.data
}

// ── 7. Suggest Profile Skills ─────────────────────────────────────────

export async function suggestProfileSkills(opts: {
  headline: string
  experiences: Array<{ title: string; company: string }>
  currentSkills: string[]
  userId?: string
}): Promise<string[]> {
  const text = await callClaude({
    functionName: 'suggestProfileSkills',
    userId: opts.userId,
    maxTokens: 256,
    system: `You are a career assistant. Suggest relevant skills a candidate should add to their profile.
Return ONLY a JSON array of skill name strings. No duplicates with existing skills. No preamble.`,
    user: `Headline: ${opts.headline}
Experience: ${opts.experiences.map((e) => `${e.title} at ${e.company}`).join(', ')}
Current skills: ${opts.currentSkills.join(', ')}

Suggest 5-8 additional relevant skills as a JSON array.`,
  })

  const cleaned = text.replace(/```json|```/g, '').trim()
  const arr = JSON.parse(cleaned)
  if (!Array.isArray(arr)) throw new Error('Expected array')
  return arr.slice(0, 8)
}

// ── 8. Generate Cover Letter ──────────────────────────────────────────

export async function generateCoverLetter(opts: {
  jobTitle: string
  companyName: string
  jobDescription: string
  candidateName: string
  candidateHeadline: string
  topSkills: string[]
  userId?: string
}): Promise<string> {
  return callClaude({
    functionName: 'generateCoverLetter',
    userId: opts.userId,
    maxTokens: 600,
    system: `You are a professional cover letter writer for Sri Lankan job seekers.
Write a compelling, concise cover letter (3 paragraphs max).
Return only the cover letter text, no subject line, no placeholders.`,
    user: `Write a cover letter for:
Candidate: ${opts.candidateName} — ${opts.candidateHeadline}
Applying for: ${opts.jobTitle} at ${opts.companyName}
Top skills: ${opts.topSkills.join(', ')}
Job description excerpt: ${opts.jobDescription.slice(0, 800)}`,
  })
}

// ── 9. Generate Interview Questions ──────────────────────────────────

export async function generateInterviewQuestions(opts: {
  jobTitle: string
  skillsRequired: string[]
  candidateSkills: string[]
  skillsMissing: string[]
  userId?: string
}): Promise<Array<{ question: string; category: string; tip: string }>> {
  const text = await callClaude({
    functionName: 'generateInterviewQuestions',
    userId: opts.userId,
    maxTokens: 1024,
    system: `You are an interview coach. Generate role-specific interview questions for a job seeker to prepare with.
Return ONLY a JSON array of objects. No preamble.`,
    user: `Role: ${opts.jobTitle}
Required skills: ${opts.skillsRequired.join(', ')}
Candidate's skills: ${opts.candidateSkills.join(', ')}
Gaps to probe: ${opts.skillsMissing.join(', ')}

Return 10 interview questions as JSON array: [{ question, category: "technical"|"behavioural"|"situational", tip: "one-sentence answer tip" }]`,
  })

  const cleaned = text.replace(/```json|```/g, '').trim()
  const arr = JSON.parse(cleaned)
  if (!Array.isArray(arr)) throw new Error('Expected array')
  return arr.slice(0, 10)
}

const CertificationValidationSchema = z.object({
  status: z.enum(['validated', 'review', 'unverified']),
  score: z.number().min(0).max(100),
  summary: z.string(),
  issuerConfidence: z.enum(['high', 'medium', 'low']),
})

export async function validateCertificationEvidence(
  certification: CertificationValidationInput,
  userId?: string,
): Promise<CertificationValidationResult> {
  const fallback = getCertificationHeuristicValidation(certification)

  if (!process.env.ANTHROPIC_API_KEY) {
    return fallback
  }

  try {
    const text = await callClaude({
      functionName: 'validateCertificationEvidence',
      userId,
      maxTokens: 512,
      system: `You validate professional certificates for a hiring platform.
Assess only the evidence provided. Do not invent external verification.
Return ONLY valid JSON with keys: status, score, summary, issuerConfidence.
Use "validated" only when the provided evidence is strong enough for employer-facing visibility.`,
      user: `Assess this certification for employer visibility:

Name: ${certification.name}
Issuer: ${certification.issuer ?? 'Not provided'}
Issued date: ${certification.issuedDate ?? 'Not provided'}
Expiry date: ${certification.expiryDate ?? 'Not provided'}
Credential URL: ${certification.credentialUrl ?? 'Not provided'}

Return JSON only.`,
    })

    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = CertificationValidationSchema.safeParse(JSON.parse(cleaned))
    if (!parsed.success) return fallback

    return {
      ...parsed.data,
      validationMethod: 'ai',
      employerVisible: parsed.data.status === 'validated',
    }
  } catch {
    return fallback
  }
}
