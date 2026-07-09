import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateOTP } from '@/lib/otp'
import { sendOTPEmail } from '@/lib/email'

const OTP_TTL_MINUTES = 5

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase admin credentials are missing')
  }

  return createClient(supabaseUrl, serviceKey)
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, company_name, role = 'manufacturer', country = '' } = await req.json()

    if (!email || !password || !company_name) {
      return NextResponse.json({ error: 'Email, password, and company name are required' }, { status: 400 })
    }

    if (String(password).length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        name: name || company_name,
        role,
        company_name,
        country
      }
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    const userId = authUser.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    const otp = generateOTP(6)
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()

    const { error: otpError } = await supabaseAdmin.from('user_otps').insert({
      user_id: userId,
      otp,
      purpose: 'email_verification',
      expires_at: expiresAt,
    })

    if (otpError) {
      return NextResponse.json({ error: otpError.message }, { status: 500 })
    }

    try {
      await sendOTPEmail(email, otp, name || company_name)
    } catch (emailError) {
      console.error('Email send failed:', emailError)
      return NextResponse.json({
        success: true,
        message: 'Account created, but OTP email could not be sent. Please resend OTP.',
        userId
      }, { status: 201 })
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email. Please verify.',
      userId,
      email,
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    )
  }
}
