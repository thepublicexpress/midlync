import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

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
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

function sanitizeSegment(value: string) {
  // Allows letters, numbers, underscores, hyphens, and forward slashes
  return value.replace(/[^a-zA-Z0-9/_-]/g, '-')
}

/**
 * Upload a file to Cloudflare R2
 * @param params.file - The file to upload (File object)
 * @param params.folder - The folder path (e.g., "products/123")
 * @param params.userId - The user ID (used as sub‑folder)
 * @param params.customKey - Optional full key override (if provided, folder and userId are ignored)
 * @param params.contentType - Optional content type override (defaults to file.type)
 * @returns { key, url }
 */
export async function uploadToR2(params: {
  file: File
  folder: string
  userId: string
  customKey?: string
  contentType?: string
}) {
  const bucket = requireEnv('R2_BUCKET_NAME')
  const publicBaseUrl = (process.env.R2_PUBLIC_URL_BASE || process.env.R2_PUBLIC_URL || '').replace(/\/$/, '')
  if (!publicBaseUrl) {
    throw new Error('R2_PUBLIC_URL_BASE or R2_PUBLIC_URL is missing')
  }

  const client = createR2Client()

  // Determine the final key
  let key: string
  if (params.customKey) {
    key = params.customKey
  } else {
    const fileExt = params.file.name.includes('.') ? params.file.name.split('.').pop() : ''
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${fileExt ? `.${fileExt}` : ''}`
    key = `${sanitizeSegment(params.folder)}/${sanitizeSegment(params.userId)}/${fileName}`
  }

  const arrayBuffer = await params.file.arrayBuffer()
  const contentType = params.contentType || params.file.type || 'application/octet-stream'

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: contentType,
    })
  )

  return {
    key,
    url: `${publicBaseUrl}/${key}`,
  }
}