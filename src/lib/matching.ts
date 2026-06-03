type JobInput = {
  id: string
  title: string
  skillsRequired: string[]
  skillsPreferred: string[]
  experienceMin?: number | null
  educationLevel?: string | null
  location?: string | null
  workMode?: string | null
}

type SeekerInput = {
  id: string
  headline?: string | null
  summary?: string | null
  skills: string[]
  location?: string | null
  preferredTypes?: string[]
  experiences: Array<{
    title: string
    company: string
    description?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    isCurrent?: boolean
  }>
  educations: Array<{
    degree?: string | null
    institution: string
  }>
  certifications?: Array<{
    name: string
    issuer?: string | null
  }>
}

export type MatchBreakdown = {
  skills: number
  experience: number
  title: number
  location: number
  education: number
  profileCompleteness: number
}

export type MatchResult = {
  score: number
  breakdown: MatchBreakdown
  strengths: string[]
  gaps: string[]
  summary: string
  skillsMatched: string[]
  skillsMissing: string[]
}

const SCORE_WEIGHTS = {
  skills: 35,
  experience: 20,
  title: 15,
  location: 10,
  education: 10,
  profileCompleteness: 10,
} as const

export function computeJobMatch(job: JobInput, seeker: SeekerInput): MatchResult {
  const seekerSkills = uniqueNormalized(seeker.skills)
  const requiredSkills = uniqueNormalized(job.skillsRequired)
  const preferredSkills = uniqueNormalized(job.skillsPreferred)
  const allJobSkills = uniqueNormalized([...job.skillsRequired, ...job.skillsPreferred])
  const seekerText = normalizeText([
    seeker.headline,
    seeker.summary,
    ...seeker.experiences.flatMap((exp) => [exp.title, exp.company, exp.description]),
    ...seeker.educations.flatMap((edu) => [edu.degree, edu.institution]),
    ...(seeker.certifications ?? []).flatMap((cert) => [cert.name, cert.issuer]),
  ].filter(Boolean).join(' '))

  const matchedRequired = requiredSkills.filter((skill) => seekerSkills.includes(skill))
  const matchedPreferred = preferredSkills.filter((skill) => seekerSkills.includes(skill))
  const skillsMatched = allJobSkills.filter((skill) => seekerSkills.includes(skill))
  const skillsMissing = requiredSkills.filter((skill) => !seekerSkills.includes(skill))

  const requiredCoverage = requiredSkills.length === 0
    ? 1
    : matchedRequired.length / requiredSkills.length
  const preferredCoverage = preferredSkills.length === 0
    ? 1
    : matchedPreferred.length / preferredSkills.length
  const skillsScore = Math.round(((requiredCoverage * 0.8) + (preferredCoverage * 0.2)) * 100)

  const experienceYears = estimateExperienceYears(seeker.experiences)
  const minExperience = Math.max(job.experienceMin ?? 0, 0)
  const experienceScore = minExperience === 0
    ? scoreFromSignal(experienceYears > 0 ? 1 : 0.65)
    : scoreFromSignal(Math.min(experienceYears / minExperience, 1))

  const titleTokens = uniqueNormalized([job.title])
  const titleHits = titleTokens.filter((token) => seekerText.includes(token))
  const titleScore = titleTokens.length === 0
    ? 60
    : scoreFromSignal(titleHits.length / titleTokens.length)

  const locationScore = computeLocationScore(job.location, job.workMode, seeker.location)
  const educationScore = computeEducationScore(job.educationLevel, seeker)
  const profileCompletenessScore = computeProfileCompletenessScore(seeker)

  const weightedScore = (
    skillsScore * SCORE_WEIGHTS.skills +
    experienceScore * SCORE_WEIGHTS.experience +
    titleScore * SCORE_WEIGHTS.title +
    locationScore * SCORE_WEIGHTS.location +
    educationScore * SCORE_WEIGHTS.education +
    profileCompletenessScore * SCORE_WEIGHTS.profileCompleteness
  ) / 100

  const breakdown: MatchBreakdown = {
    skills: skillsScore,
    experience: experienceScore,
    title: titleScore,
    location: locationScore,
    education: educationScore,
    profileCompleteness: profileCompletenessScore,
  }

  const strengths = buildStrengths({
    matchedRequired,
    matchedPreferred,
    experienceYears,
    job,
    seeker,
    scores: breakdown,
  })
  const gaps = buildGaps({
    skillsMissing,
    experienceYears,
    job,
    seeker,
    scores: breakdown,
  })

  return {
    score: Math.max(0, Math.min(100, Math.round(weightedScore))),
    breakdown,
    strengths,
    gaps,
    summary: buildSummary(weightedScore, matchedRequired.length, requiredSkills.length, strengths, gaps),
    skillsMatched,
    skillsMissing,
  }
}

function buildStrengths(input: {
  matchedRequired: string[]
  matchedPreferred: string[]
  experienceYears: number
  job: JobInput
  seeker: SeekerInput
  scores: MatchBreakdown
}) {
  const strengths: string[] = []

  if (input.matchedRequired.length > 0) {
    strengths.push(`Matches ${input.matchedRequired.length} required skill${input.matchedRequired.length === 1 ? '' : 's'} including ${input.matchedRequired.slice(0, 3).join(', ')}`)
  }
  if ((input.job.experienceMin ?? 0) > 0 && input.experienceYears >= (input.job.experienceMin ?? 0)) {
    strengths.push(`Meets the experience target with about ${input.experienceYears} year${input.experienceYears === 1 ? '' : 's'} of relevant experience`)
  }
  if (input.matchedPreferred.length > 0) {
    strengths.push(`Also brings preferred skills like ${input.matchedPreferred.slice(0, 3).join(', ')}`)
  }
  if (input.scores.location >= 90) {
    strengths.push('Location and work mode look like a strong fit')
  }
  if (input.scores.profileCompleteness >= 80) {
    strengths.push('Profile is detailed enough to support a confident match assessment')
  }

  return strengths.slice(0, 4)
}

function buildGaps(input: {
  skillsMissing: string[]
  experienceYears: number
  job: JobInput
  seeker: SeekerInput
  scores: MatchBreakdown
}) {
  const gaps: string[] = []

  if (input.skillsMissing.length > 0) {
    gaps.push(`Missing ${input.skillsMissing.length} required skill${input.skillsMissing.length === 1 ? '' : 's'}: ${input.skillsMissing.slice(0, 3).join(', ')}`)
  }
  if ((input.job.experienceMin ?? 0) > 0 && input.experienceYears < (input.job.experienceMin ?? 0)) {
    gaps.push(`Experience appears below the target of ${input.job.experienceMin} year${input.job.experienceMin === 1 ? '' : 's'}`)
  }
  if (input.scores.education < 70 && input.job.educationLevel) {
    gaps.push(`Education fit is unclear against the stated requirement of ${input.job.educationLevel}`)
  }
  if (input.scores.profileCompleteness < 60) {
    gaps.push('Profile could be stronger with more complete skills, summary, and experience details')
  }

  return gaps.slice(0, 4)
}

function buildSummary(
  weightedScore: number,
  matchedRequiredCount: number,
  requiredCount: number,
  strengths: string[],
  gaps: string[],
) {
  const tier =
    weightedScore >= 80 ? 'Strong fit' :
    weightedScore >= 65 ? 'Promising fit' :
    weightedScore >= 50 ? 'Partial fit' :
    'Early fit'

  const coverage = requiredCount === 0
    ? 'The role does not list required skills explicitly.'
    : `You match ${matchedRequiredCount} of ${requiredCount} required skill${requiredCount === 1 ? '' : 's'}.`

  const nextSignal = strengths[0] ?? gaps[0] ?? 'More profile detail would improve the confidence of this match.'
  return `${tier} for this role. ${coverage} ${nextSignal}.`
}

function computeLocationScore(jobLocation?: string | null, workMode?: string | null, seekerLocation?: string | null) {
  if (workMode === 'remote') return 100
  if (!jobLocation || !seekerLocation) return 60

  const jobNormalized = normalizeText(jobLocation)
  const seekerNormalized = normalizeText(seekerLocation)

  if (jobNormalized === seekerNormalized) return 100
  if (jobNormalized.includes(seekerNormalized) || seekerNormalized.includes(jobNormalized)) return 85

  const jobTokens = uniqueNormalized([jobLocation])
  const seekerTokens = uniqueNormalized([seekerLocation])
  const overlap = jobTokens.filter((token) => seekerTokens.includes(token))
  if (overlap.length > 0) return 75

  return workMode === 'hybrid' ? 55 : 40
}

function computeEducationScore(jobEducationLevel: string | null | undefined, seeker: SeekerInput) {
  if (!jobEducationLevel) return seeker.educations.length > 0 ? 90 : 70

  const target = normalizeText(jobEducationLevel)
  if (seeker.educations.length === 0) return 35

  const educationText = normalizeText(seeker.educations.map((edu) => `${edu.degree ?? ''} ${edu.institution}`).join(' '))
  if (!target) return 75
  if (educationText.includes(target)) return 100

  const commonDegreeWords = ['bachelor', 'masters', 'master', 'diploma', 'degree', 'nvq', 'certificate']
  if (commonDegreeWords.some((word) => target.includes(word) && educationText.includes(word))) return 80

  return 60
}

function computeProfileCompletenessScore(seeker: SeekerInput) {
  let points = 0
  if ((seeker.headline ?? '').trim()) points += 20
  if ((seeker.summary ?? '').trim()) points += 20
  if (seeker.skills.length >= 3) points += 20
  if (seeker.experiences.length > 0) points += 20
  if (seeker.educations.length > 0 || (seeker.certifications ?? []).length > 0) points += 10
  if ((seeker.location ?? '').trim()) points += 10
  return points
}

function estimateExperienceYears(experiences: SeekerInput['experiences']) {
  if (experiences.length === 0) return 0

  const totalMonths = experiences.reduce((sum, exp) => {
    const start = toDate(exp.startDate)
    if (!start) return sum
    const end = exp.isCurrent ? new Date() : toDate(exp.endDate) ?? new Date()
    const months = Math.max(1, monthDiff(start, end))
    return sum + months
  }, 0)

  return Math.round((totalMonths / 12) * 10) / 10
}

function toDate(value?: Date | string | null) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function monthDiff(start: Date, end: Date) {
  const years = end.getFullYear() - start.getFullYear()
  const months = end.getMonth() - start.getMonth()
  return years * 12 + months
}

function uniqueNormalized(values: string[]) {
  return Array.from(new Set(values.map(normalizeToken).filter(Boolean)))
}

function normalizeToken(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9+\s#./-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeText(value: string) {
  return value.toLowerCase().trim()
}

function scoreFromSignal(signal: number) {
  return Math.max(0, Math.min(100, Math.round(signal * 100)))
}
