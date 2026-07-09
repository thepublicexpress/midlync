import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { email, otp, password, confirmPassword } = await req.json()

    if (!email || !otp || !password || !confirmPassword) {
      return NextResponse.json({ error: 'Email, OTP, and password fields are required' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    if (String(password).length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
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

    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('user_otps')
      .select('*')
      .eq('user_id', user.id)
      .eq('purpose', 'password_reset')
      .eq('otp', String(otp).trim())
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password,
      user_metadata: {
        ...user.user_metadata,
        password_reset_at: new Date().toISOString()
      }
    })

    await supabaseAdmin
      .from('user_otps')
      .update({ verified: true })
      .eq('id', otpRecord.id)

    return NextResponse.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Password reset failed' },
      { status: 500 }
    )
  }
}
