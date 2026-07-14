import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOTPEmail } from '@/lib/email'
import { generateOTP } from '@/lib/otp'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, user_type, company_name, phone, country, city, address, trade_license, gst_number } = await req.json()

    // Basic validation
    if (!email || !password || !user_type) {
      return NextResponse.json({ error: 'Email, password, and user_type are required' }, { status: 400 })
    }

    // 1. Check if user already exists in auth.users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    const existingUser = users.find(u => u.email === email)

    if (existingUser) {
      // If user exists and already verified => error
      if (existingUser.email_confirmed_at) {
        return NextResponse.json({ error: 'Email already registered and verified. Please login.' }, { status: 409 })
      }

      // If user exists but not verified => resend OTP
      const otp = generateOTP()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

      // Upsert OTP in user_otps table
      await supabaseAdmin
        .from('user_otps')
        .upsert({
          user_id: existingUser.id,
          otp,
          expires_at: expiresAt,
          verified: false,
          attempts: 0,
        }, { onConflict: 'user_id' })

      // Send OTP email
      await sendOTPEmail(email, otp, existingUser.user_metadata?.name || name)

      return NextResponse.json({
        success: true,
        message: 'A new OTP has been sent to your email. Please verify.',
        userId: existingUser.id,
        alreadyExists: true,
      }, { status: 200 })
    }

    // 2. Create new user (email_confirm = false)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        name,
        user_type,
        company_name,
        phone,
        country,
        city,
        address,
        trade_license,
        gst_number,
      },
    })

    if (createError) throw createError

    const userId = newUser.user.id
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    // Insert OTP record
    await supabaseAdmin
      .from('user_otps')
      .insert({
        user_id: userId,
        otp,
        expires_at: expiresAt,
      })

    // Send OTP email
    await sendOTPEmail(email, otp, name)

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email. Please verify.',
      userId,
    }, { status: 201 })

  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 })
  }
}