import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'

// ── R2 Client ──
function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is missing`)
  return value
}

function createR2Client() {
  const accountId = requireEnv('R2_ACCOUNT_ID')
  const accessKeyId = requireEnv('R2_ACCESS_KEY_ID')
  const secretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY')
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
}

function extractKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    // Remove leading slash from pathname to get the key
    return parsed.pathname.slice(1)
  } catch {
    return null
  }
}

// ─── DELETE ─────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch product to verify ownership and get image URLs
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('manufacturer_id, images, image_url')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Ensure the logged-in user owns this product
    if (product.manufacturer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Fetch all image URLs from product_images table
    const { data: productImages, error: imagesError } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', productId)

    if (imagesError) {
      console.error('Error fetching product_images:', imagesError)
    }

    // 3. Collect all image URLs
    const imageUrls: string[] = []
    if (product.images && Array.isArray(product.images)) {
      imageUrls.push(...product.images)
    }
    if (product.image_url) {
      imageUrls.push(product.image_url)
    }
    if (productImages && productImages.length > 0) {
      productImages.forEach(img => {
        if (img.image_url) imageUrls.push(img.image_url)
      })
    }

    // 4. Delete each image from R2
    const r2Client = createR2Client()
    const bucket = requireEnv('R2_BUCKET_NAME')
    const deletePromises = imageUrls
      .map(url => extractKeyFromUrl(url))
      .filter((key): key is string => key !== null)
      .map(key =>
        r2Client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        ).catch(err => {
          console.error(`Failed to delete R2 object: ${key}`, err)
        })
      )

    await Promise.allSettled(deletePromises)

    // 5. Delete product_images records from Supabase
    await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId)

    // 6. Delete the product record
    const { error: deleteProductError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (deleteProductError) {
      return NextResponse.json({ error: deleteProductError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Product and associated images deleted successfully',
    })

  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── GET (Optional – if you need to fetch a single product) ──
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.manufacturer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ success: true, product })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}