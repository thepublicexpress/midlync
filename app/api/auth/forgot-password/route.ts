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
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    const user = usersData.users.find(userItem => userItem.email?.toLowerCase() === String(email).toLowerCase())
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const otp = generateOTP(6)
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()

    await supabaseAdmin
      .from('user_otps')
      .update({ verified: true })
      .eq('user_id', user.id)
      .eq('purpose', 'password_reset')
      .eq('verified', false)

    const { error: insertError } = await supabaseAdmin.from('user_otps').insert({
      user_id: user.id,
      otp,
      purpose: 'password_reset',
      expires_at: expiresAt,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    await sendOTPEmail(email, otp, user.user_metadata?.name || user.user_metadata?.company_name)

    return NextResponse.json({ success: true, message: 'Password reset OTP sent successfully' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send reset OTP' },
      { status: 500 }
    )
  }
}
