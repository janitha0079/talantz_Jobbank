export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'
import { requireSeeker } from '@/lib/auth'
import { inngest } from '@/inngest/client'

// Lazy init — avoids crash at build time when env vars are not set
let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!_supabase) _supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder',
  )
  return _supabase
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export async function POST(req: NextRequest) {
  try {
    const session = await requireSeeker()

    const formData = await req.formData()
    const file = formData.get('cv') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 5MB.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF and DOCX files are accepted' }, { status: 400 })
    }

    const ext = file.type === 'application/pdf' ? 'pdf' : 'docx'
    const path = `cvs/${session.user.id}/${Date.now()}.${ext}`

    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await getSupabase().storage
      .from('private')
      .upload(path, Buffer.from(bytes), {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('[cv-upload] storage error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Store the path in the seeker profile
    await db.seekerProfile.upsert({
      where: { userId: session.user.id },
      update: { cvUrl: path },
      create: { userId: session.user.id, cvUrl: path, isPublic: true },
    })

    // Queue AI CV parsing
    await inngest.send({
      name: 'profile/cv.uploaded',
      data: { userId: session.user.id, cvPath: path, fileType: ext },
    })

    return NextResponse.json({
      message: 'CV uploaded. AI parsing started — your profile will update shortly.',
      cvPath: path,
    })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('[cv-upload]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
