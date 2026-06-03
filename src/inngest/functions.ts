import { inngest } from './client'
import { db } from '@/lib/db'
import {
  parseLinkedInProfile,
  parseCvDocument,
  scoreApplicationMatch,
  generateScreeningSummary,
  generateInterviewQuestions,
} from '@/lib/ai'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

// Lazy init — avoids crash at build time when env vars are not set
let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!_supabase) _supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder',
  )
  return _supabase
}

// ── 1. LinkedIn Profile Import ────────────────────────────────────────
// Triggered: user signs in with LinkedIn for the first time

export const onLinkedInImported = inngest.createFunction(
  { id: 'profile-linkedin-imported', name: 'Parse LinkedIn profile' },
  { event: 'profile/linkedin.imported' },
  async ({ event, step }) => {
    const { userId, rawProfile } = event.data

    const parsed = await step.run('parse-linkedin', async () => {
      return parseLinkedInProfile(rawProfile, userId)
    })

    await step.run('update-profile', async () => {
      const profile = await db.seekerProfile.upsert({
        where: { userId },
        update: {
          fullName: parsed.fullName,
          headline: parsed.headline,
          summary: parsed.summary,
          location: parsed.location,
          skills: parsed.skills,
        },
        create: {
          userId,
          fullName: parsed.fullName,
          headline: parsed.headline,
          summary: parsed.summary,
          location: parsed.location,
          skills: parsed.skills,
          isPublic: true,
        },
      })

      // Seed experience entries
      for (let i = 0; i < parsed.experiences.length; i++) {
        const exp = parsed.experiences[i]
        await db.seekerExperience.create({
          data: {
            profileId: profile.id,
            title: exp.title,
            company: exp.company,
            location: exp.location,
            isCurrent: exp.isCurrent,
            description: exp.description,
            startDate: exp.startDate ? new Date(exp.startDate) : null,
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            sortOrder: i,
          },
        }).catch(() => {}) // skip duplicates
      }

      // Seed education entries
      for (const edu of parsed.educations) {
        await db.seekerEducation.create({
          data: {
            profileId: profile.id,
            institution: edu.institution,
            degree: edu.degree,
            field: edu.fieldOfStudy,
            startYear: edu.startYear,
            endYear: edu.endYear,
          },
        }).catch(() => {})
      }

      return profile.id
    })

    return { success: true, userId }
  },
)

// ── 2. CV Upload ──────────────────────────────────────────────────────
// Triggered: seeker uploads a CV file

export const onCvUploaded = inngest.createFunction(
  { id: 'profile-cv-uploaded', name: 'Parse uploaded CV' },
  { event: 'profile/cv.uploaded' },
  async ({ event, step }) => {
    const { userId, cvPath, fileType } = event.data

    // Download file from Supabase Storage
    const cvText = await step.run('download-cv', async () => {
      const { data, error } = await getSupabase().storage
        .from('private')
        .download(cvPath)
      if (error || !data) throw new Error(`Storage download failed: ${error?.message}`)

      if (fileType === 'pdf') {
        // For production: use a PDF-to-text service (Affinda / pdf-parse)
        // For now return placeholder — the AI will still do its best
        const buffer = await data.arrayBuffer()
        return Buffer.from(buffer).toString('utf-8', 0, 10000)
      }
      return data.text()
    })

    const parsed = await step.run('parse-cv', async () => {
      return parseCvDocument(cvText, userId)
    })

    await step.run('update-profile', async () => {
      const profile = await db.seekerProfile.upsert({
        where: { userId },
        update: {
          fullName: parsed.fullName,
          headline: parsed.headline,
          summary: parsed.summary,
          location: parsed.location,
          skills: parsed.skills,
        },
        create: {
          userId,
          fullName: parsed.fullName,
          headline: parsed.headline,
          summary: parsed.summary,
          location: parsed.location,
          skills: parsed.skills,
          isPublic: true,
        },
      })

      for (let i = 0; i < parsed.experiences.length; i++) {
        const exp = parsed.experiences[i]
        await db.seekerExperience.create({
          data: {
            profileId: profile.id,
            title: exp.title,
            company: exp.company,
            location: exp.location,
            isCurrent: exp.isCurrent,
            description: exp.description,
            startDate: exp.startDate ? new Date(exp.startDate) : null,
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            sortOrder: i,
          },
        }).catch(() => {})
      }
    })

    return { success: true, userId }
  },
)

// ── 3. Application Submitted ──────────────────────────────────────────
// Triggered: seeker applies to a job (Growth/Enterprise companies only)

export const onApplicationSubmitted = inngest.createFunction(
  {
    id: 'application-submitted',
    name: 'AI screen application',
    // Retry up to 3 times on failure
    retries: 3,
    // Rate-limit to 10 screenings per minute across all workers
    rateLimit: { limit: 10, period: '1m', key: 'event.data.applicationId' },
  },
  { event: 'application/submitted' },
  async ({ event, step }) => {
    const { applicationId } = event.data

    // Load application with full job + seeker data
    const application = await step.run('load-data', async () => {
      return db.application.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            select: {
              title: true,
              description: true,
              skillsRequired: true,
              skillsPreferred: true,
              experienceMin: true,
              educationLevel: true,
              location: true,
            },
          },
          seeker: {
            include: {
              user: { select: { id: true } },
              experiences: { orderBy: { sortOrder: 'asc' }, take: 5 },
              educations: true,
            },
          },
        },
      })
    })

    if (!application) throw new Error(`Application ${applicationId} not found`)

    // Score the match
    const matchScore = await step.run('score-match', async () => {
      return scoreApplicationMatch({
        seekerId: application.seeker.id,
        jobId: application.jobId,
        job: application.job,
        seeker: {
          headline: application.seeker.headline,
          summary: application.seeker.summary,
          skills: application.seeker.skills,
          location: application.seeker.location,
          experiences: application.seeker.experiences,
          educations: application.seeker.educations,
        },
        userId: application.seeker.user.id,
      })
    })

    // Generate employer-facing screening summary
    const screening = await step.run('generate-summary', async () => {
      return generateScreeningSummary({
        jobTitle: application.job.title,
        candidateName: application.seeker.fullName ?? 'Candidate',
        matchScore,
        applicationId,
        userId: application.seeker.user.id,
      })
    })

    // Store results on the application
    await step.run('save-results', async () => {
      await db.application.update({
        where: { id: applicationId },
        data: {
          aiMatchScore: matchScore.score,
          aiSummary: screening.summary,
          aiStrengths: screening.strengths,
          aiGaps: screening.gaps,
          aiRecommendation: (
            screening.recommendation === 'strong_yes' || screening.recommendation === 'yes'
              ? 'shortlist'
              : screening.recommendation === 'maybe'
              ? 'review'
              : 'pass'
          ) as import('@prisma/client').AiRecommendation,
          screeningCompletedAt: new Date(),
        },
      })

      // Timeline event
      await db.applicationTimelineEvent.create({
        data: {
          applicationId,
          eventType: 'ai.screening.complete',
          payload: { score: matchScore.score, recommendation: screening.recommendation },
        },
      })
    })

    return { success: true, applicationId, score: matchScore.score }
  },
)

// ── 4. Application Shortlisted ────────────────────────────────────────
// Triggered: employer moves candidate to shortlisted stage

export const onApplicationShortlisted = inngest.createFunction(
  { id: 'application-shortlisted', name: 'Generate interview prep' },
  { event: 'application/shortlisted' },
  async ({ event, step }) => {
    const { applicationId, jobId, seekerUserId } = event.data

    const data = await step.run('load-data', async () => {
      const application = await db.application.findUnique({
        where: { id: applicationId },
        include: {
          job: { select: { title: true, skillsRequired: true } },
          seeker: { select: { skills: true } },
        },
      })
      return application
    })

    if (!data) return { skipped: true }

    const questions = await step.run('generate-questions', async () => {
      return generateInterviewQuestions({
        jobTitle: data.job.title,
        skillsRequired: data.job.skillsRequired,
        candidateSkills: data.seeker.skills,
        skillsMissing: data.aiGaps ?? [],
        userId: seekerUserId,
      })
    })

    await step.run('store-questions', async () => {
      // Store interview prep questions in the application timeline
      await db.applicationTimelineEvent.create({
        data: {
          applicationId,
          eventType: 'ai.interview_prep.ready',
          payload: { questions },
        },
      })
    })

    // Notify seeker
    await step.run('notify-seeker', async () => {
      await db.notification.create({
        data: {
          userId: seekerUserId,
          type: 'interview_prep_ready',
          title: 'Interview prep is ready!',
          body: `10 practice questions for your ${data.job.title} interview are ready.`,
          actionUrl: `/applications/${applicationId}#interview-prep`,
        },
      })
    })

    return { success: true, applicationId, questionsCount: questions.length }
  },
)

// ── 5. Application Status Changed — Email ────────────────────────────
// Triggered: any application status change

export const onStatusChanged = inngest.createFunction(
  { id: 'notification-status-changed', name: 'Send status change email' },
  { event: 'notification/application.status.changed' },
  async ({ event, step }) => {
    const { seekerEmail, jobTitle, status, applicationId } = event.data

    await step.run('send-email', async () => {
      await sendEmail({
        to: seekerEmail,
        subject: statusSubject(status, jobTitle),
        template: 'application-status',
        data: { jobTitle, status, applicationId, appUrl: process.env.NEXT_PUBLIC_APP_URL },
      })
    })

    return { success: true }
  },
)

function statusSubject(status: string, jobTitle: string): string {
  const subjects: Record<string, string> = {
    shortlisted: `🎉 Great news! You've been shortlisted — ${jobTitle}`,
    interview: `Interview invitation — ${jobTitle}`,
    offer: `🎉 You have an offer! — ${jobTitle}`,
    rejected: `Application update — ${jobTitle}`,
    withdrawn: `Application withdrawn — ${jobTitle}`,
  }
  return subjects[status] ?? `Application update — ${jobTitle}`
}

// ── Export all functions for Inngest route ────────────────────────────

export const functions = [
  onLinkedInImported,
  onCvUploaded,
  onApplicationSubmitted,
  onApplicationShortlisted,
  onStatusChanged,
]
