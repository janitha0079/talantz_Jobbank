import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') ?? '30')
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Aggregate usage by function name
    const byFunction = await db.aiUsageLog.groupBy({
      by: ['functionName'],
      where: { createdAt: { gte: since } },
      _sum: { inputTokens: true, outputTokens: true },
      _count: { id: true },
      _avg: { latencyMs: true },
    })

    // Error rates per function
    const errorCounts = await db.aiUsageLog.groupBy({
      by: ['functionName'],
      where: { createdAt: { gte: since }, success: false },
      _count: { id: true },
    })

    const errorMap = Object.fromEntries(
      (errorCounts as Array<{ functionName: string; _count: { id: number } }>)
        .map((e) => [e.functionName, e._count.id]),
    )

    // Total
    const totals = await db.aiUsageLog.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { inputTokens: true, outputTokens: true },
      _count: { id: true },
    })

    const functions = (byFunction as Array<{
      functionName: string
      _count: { id: number }
      _sum: { inputTokens: number | null; outputTokens: number | null }
      _avg: { latencyMs: number | null }
    }>).map((f) => ({
      functionName: f.functionName,
      calls: f._count.id,
      inputTokens: f._sum.inputTokens ?? 0,
      outputTokens: f._sum.outputTokens ?? 0,
      totalTokens: (f._sum.inputTokens ?? 0) + (f._sum.outputTokens ?? 0),
      avgLatencyMs: Math.round(f._avg.latencyMs ?? 0),
      errors: (errorMap[f.functionName] as number) ?? 0,
      errorRate: f._count.id > 0
        ? (((errorMap[f.functionName] as number) ?? 0) / f._count.id * 100).toFixed(1)
        : '0.0',
    }))

    const t = totals as { _count: { id: number }; _sum: { inputTokens: number | null; outputTokens: number | null } }

    return NextResponse.json({
      data: {
        functions,
        totals: {
          calls: t._count.id,
          inputTokens: t._sum.inputTokens ?? 0,
          outputTokens: t._sum.outputTokens ?? 0,
        },
        periodDays: days,
      },
    })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
