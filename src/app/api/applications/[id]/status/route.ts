import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { inngest } from '@/inngest/client'

const updateStatusSchema = z.object({
  status: z.enum([
    'screening', 'shortlisted', 'interview',
    'assessment', 'offer', 'hired', 'rejected', 'withdrawn',
  ]),
  rejectionReason: z.string().optional(),
  employerNotes: z.string().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole([
      'employer_admin', 'employer_member', 'super_admin', 'job_seeker',
    ])
    const body = await req.json()
    const { status, rejectionReason, employerNotes } = updateStatusSchema.parse(body)

    const application = await db.application.findUnique({
      where: { id: params.id },
      include: {
        job: { include: { company: { include: { members: true } } } },
        seeker: { include: { user: true } },
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const role = session.user.role

    // Seekers can only withdraw their own applications
    if (role === 'job_seeker') {
      const seekerProfile = await db.seekerProfile.findUnique({
        where: { userId: session.user.id },
      })
      if (application.seekerId !== seekerProfile?.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (status !== 'withdrawn') {
        return NextResponse.json({ error: 'Seekers can only withdraw applications' }, { status: 403 })
      }
    } else {
      // Employer must be member of the company
      const isMember = application.job.company.members.some(
        (m: { userId: string; role: string }) => m.userId === session.user.id,
      )
      if (!isMember && role !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const previousStatus = application.status

    // Update application
    const updated = await db.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: params.id },
        data: {
          status,
          stageChangedAt: new Date(),
          ...(rejectionReason ? { rejectionReason } : {}),
          ...(employerNotes !== undefined ? { employerNotes } : {}),
        },
      })

      // Timeline event
      await tx.applicationTimelineEvent.create({
        data: {
          applicationId: params.id,
          actorId: session.user.id,
          eventType: 'status.changed',
          payload: { from: previousStatus, to: status },
        },
      })

      return app
    })

    // Notify the seeker
    await db.notification.create({
      data: {
        userId: application.seeker.userId,
        type: 'application_status_changed',
        title: statusTitle(status),
        body: statusBody(status, application.job.title),
        actionUrl: `/applications/${application.id}`,
      },
    })

    // Fire interview prep generation if shortlisted
    if (status === 'shortlisted') {
      await inngest.send({
        name: 'application/shortlisted',
        data: {
          applicationId: application.id,
          jobId: application.jobId,
          seekerUserId: application.seeker.userId,
        },
      })
    }

    // Fire email notification
    await inngest.send({
      name: 'notification/application.status.changed',
      data: {
        applicationId: application.id,
        status,
        seekerEmail: application.seeker.user.email,
        jobTitle: application.job.title,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('[PUT /applications/:id/status]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function statusTitle(status: string): string {
  const titles: Record<string, string> = {
    screening: 'Your application is being reviewed',
    shortlisted: '🎉 You\'ve been shortlisted!',
    interview: 'Interview invitation',
    offer: '🎉 You\'ve received an offer!',
    hired: 'Congratulations — you\'re hired!',
    rejected: 'Application update',
    withdrawn: 'Application withdrawn',
  }
  return titles[status] ?? 'Application update'
}

function statusBody(status: string, jobTitle: string): string {
  const bodies: Record<string, string> = {
    screening: `Your application for ${jobTitle} is being reviewed by the employer.`,
    shortlisted: `Great news! You\'ve been shortlisted for ${jobTitle}.`,
    interview: `You\'ve been invited to interview for ${jobTitle}.`,
    offer: `An offer has been made for ${jobTitle}. Check your application for details.`,
    hired: `You\'ve been hired for ${jobTitle}. Congratulations!`,
    rejected: `Thank you for applying to ${jobTitle}. The employer has moved forward with other candidates.`,
    withdrawn: `You have withdrawn your application for ${jobTitle}.`,
  }
  return bodies[status] ?? `Your application for ${jobTitle} has been updated.`
}
