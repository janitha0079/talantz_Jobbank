export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET /api/notifications
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const unreadOnly = new URL(req.url).searchParams.get('unread') === 'true'

    const notifications = await db.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = await db.notification.count({
      where: { userId: session.user.id, isRead: false },
    })

    return NextResponse.json({ data: notifications, unreadCount })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/notifications/read — mark all or specific as read
export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json().catch(() => ({}))
    const ids: string[] = body.ids ?? []

    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
        ...(ids.length > 0 ? { id: { in: ids } } : {}),
      },
      data: { isRead: true },
    })

    return NextResponse.json({ message: 'Marked as read' })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
