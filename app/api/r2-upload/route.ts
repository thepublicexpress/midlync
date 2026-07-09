import { NextRequest, NextResponse } from 'next/server'
import { POST as uploadPost } from '../uploads/route'

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return NextResponse.json(
      {
        error:
          'This endpoint now expects multipart/form-data with file and folder fields. Use /api/uploads.',
      },
      { status: 400 }
    )
  }

  return uploadPost(request)
}
