import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToR2 } from '@/lib/r2'

const ALLOWED_FOLDERS = new Set([
  'products',
  'profiles/logo',
  'profiles/factory',
  'profiles/certification',
  'assets',
  'purchase-orders',
])

const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/csv',
])

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const folder = String(formData.get('folder') || '')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
    }

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    const isDocument = ALLOWED_DOCUMENT_TYPES.has(file.type)
    if (!isImage && !isVideo && !isDocument) {
      return NextResponse.json({ error: 'Only image, video, and supported document uploads are allowed' }, { status: 400 })
    }

    const uploaded = await uploadToR2({
      file,
      folder,
      userId: user.id,
    })

    return NextResponse.json({ success: true, url: uploaded.url, key: uploaded.key })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
