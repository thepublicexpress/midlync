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
  return value.replace(/[^a-zA-Z0-9/_-]/g, '-')
}

export async function uploadToR2(params: {
  file: File
  folder: string
  userId: string
}) {
  const bucket = requireEnv('R2_BUCKET_NAME')
  const publicBaseUrl = (process.env.R2_PUBLIC_URL_BASE || process.env.R2_PUBLIC_URL || '').replace(/\/$/, '')
  if (!publicBaseUrl) {
    throw new Error('R2_PUBLIC_URL_BASE or R2_PUBLIC_URL is missing')
  }
  const client = createR2Client()

  const fileExt = params.file.name.includes('.') ? params.file.name.split('.').pop() : ''
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${fileExt ? `.${fileExt}` : ''}`
  const key = `${sanitizeSegment(params.folder)}/${sanitizeSegment(params.userId)}/${fileName}`
  const arrayBuffer = await params.file.arrayBuffer()

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: params.file.type || 'application/octet-stream',
    })
  )

  return {
    key,
    url: `${publicBaseUrl}/${key}`,
  }
}
