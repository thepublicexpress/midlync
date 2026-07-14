import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOTPEmail } from '@/lib/email'
import { generateOTP } from '@/lib/otp'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, user_type, company_name, phone, country, city, address, trade_license, gst_number } = body

    if (!email || !password || !user_type) {
      return NextResponse.json({ error: 'Email, password, and user_type are required' }, { status: 400 })
    }

    // 1. Check if user exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError
    const existingUser = users.find(u => u.email === email)

    if (existingUser) {
      if (existingUser.email_confirmed_at) {
        return NextResponse.json({ error: 'Email already registered and verified. Please login.' }, { status: 409 })
      }
      // Resend OTP for unverified
      const otp = generateOTP()
      await supabaseAdmin
        .from('user_otps')
        .upsert({
          user_id: existingUser.id,
          otp,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          verified: false,
          attempts: 0,
        }, { onConflict: 'user_id' })
      await sendOTPEmail(email, otp, existingUser.user_metadata?.name || company_name)
      return NextResponse.json({
        success: true,
        message: 'OTP resent to your email. Please verify.',
        userId: existingUser.id,
        alreadyExists: true,
      }, { status: 200 })
    }

    // 2. Create new user (email_confirm = false)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { name: company_name, user_type, company_name, phone, country, city, address, trade_license, gst_number },
    })
    if (createError) throw createError

    const userId = newUser.user.id

    // 3. Create profile entry (including buyer_code / manufacturer_code)
    const isManufacturer = user_type === 'manufacturer'
    const code = isManufacturer
      ? `MFR-${Math.floor(1000000 + Math.random() * 9000000)}`
      : `BYR-${Math.floor(1000000 + Math.random() * 9000000)}`

    const profileData: any = {
      id: userId,
      email,
      role: user_type,
      company_name,
      phone,
      country,
      city,
      address,
      trade_license: trade_license || null,
      gst_number: gst_number || null,
      is_approved: false,
      approval_status: 'pending',
      created_at: new Date().toISOString(),
    }
    if (isManufacturer) {
      profileData.manufacturer_code = code
    } else {
      profileData.buyer_code = code
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)

    if (profileError) {
      console.error('Profile insert error:', profileError)
      // Continue anyway – we'll handle missing profiles in inquiries API
    }

    // 4. Store OTP
    const otp = generateOTP()
    await supabaseAdmin
      .from('user_otps')
      .insert({
        user_id: userId,
        otp,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      })

    await sendOTPEmail(email, otp, company_name)

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