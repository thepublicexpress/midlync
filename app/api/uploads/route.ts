import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToR2 } from '@/lib/r2'
import sharp from 'sharp'

// Increase body size limit to allow multiple images
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const folder = String(formData.get('folder') || '')
    const productId = formData.get('product_id') as string | null

    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
    }

    // For product images, we expect multiple files and product_id
    if (folder === 'products') {
      if (!productId) {
        return NextResponse.json({ error: 'Product ID is required for product images' }, { status: 400 })
      }

      const files = formData.getAll('files') as File[]
      if (!files || files.length === 0) {
        return NextResponse.json({ error: 'At least one image is required' }, { status: 400 })
      }

      const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB per file
      const uploadedUrls = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate type
        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
          return NextResponse.json(
            { error: `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, HEIC` },
            { status: 400 }
          )
        }
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `File "${file.name}" exceeds 10 MB limit` },
            { status: 400 }
          )
        }

        // Read buffer
        const buffer = Buffer.from(await file.arrayBuffer())

        // Compress and convert to WebP (quality: 80)
        const webpBuffer = await sharp(buffer)
          .webp({ quality: 80, effort: 6 })
          .toBuffer()

        // Create a new File object (or just upload the buffer)
        // We need to pass a file-like object to uploadToR2; we can create a Blob/File
        const webpFile = new File([webpBuffer], `${Date.now()}-${i}.webp`, {
          type: 'image/webp',
        })

        // Upload to R2 using your existing uploadToR2
        const uploaded = await uploadToR2({
          file: webpFile,
          folder: `products/${productId}`,
          userId: user.id,
        })

        // Save record to product_images
        const { error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: uploaded.url,
            is_primary: i === 0, // first image is primary
            sort_order: i + 1,
          })

        if (dbError) {
          console.error('Error saving image record:', dbError)
          // Continue anyway – we already uploaded
        }

        uploadedUrls.push(uploaded.url)
      }

      return NextResponse.json({
        success: true,
        urls: uploadedUrls,
        message: `${uploadedUrls.length} images uploaded and compressed to WebP.`,
      })
    }

    // For other folders (profiles, assets, etc.) – single file upload
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
    }

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    const isDocument = ALLOWED_DOCUMENT_TYPES.has(file.type)
    if (!isImage && !isVideo && !isDocument) {
      return NextResponse.json({ error: 'Only image, video, and supported document uploads are allowed' }, { status: 400 })
    }

    // For images, we also compress to WebP (except for documents/videos)
    let finalFile = file
    if (isImage && ALLOWED_IMAGE_TYPES.has(file.type)) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const webpBuffer = await sharp(buffer)
        .webp({ quality: 80, effort: 6 })
        .toBuffer()
      finalFile = new File([webpBuffer], `${Date.now()}-${file.name.split('.')[0]}.webp`, {
        type: 'image/webp',
      })
    }

    const uploaded = await uploadToR2({
      file: finalFile,
      folder,
      userId: user.id,
    })

    return NextResponse.json({ success: true, url: uploaded.url, key: uploaded.key })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}