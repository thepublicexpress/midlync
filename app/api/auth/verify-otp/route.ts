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

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
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
      .eq('purpose', 'email_verification')
      .eq('otp', String(otp).trim())
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      const latestOtp = await supabaseAdmin
        .from('user_otps')
        .select('id, attempts')
        .eq('user_id', user.id)
        .eq('purpose', 'email_verification')
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestOtp.data?.id) {
        await supabaseAdmin
          .from('user_otps')
          .update({ attempts: (latestOtp.data.attempts || 0) + 1 })
          .eq('id', latestOtp.data.id)
      }

      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    await supabaseAdmin
      .from('user_otps')
      .update({ verified: true })
      .eq('id', otpRecord.id)

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
      user_metadata: {
        ...user.user_metadata,
        email_verified: true
      }
    })

    await supabaseAdmin.from('profiles').upsert({
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'manufacturer',
      company_name: user.user_metadata?.company_name || '',
      country: user.user_metadata?.country || ''
    }, { onConflict: 'id' })

    return NextResponse.json({ success: true, message: 'Email verified successfully', role: user.user_metadata?.role || 'manufacturer' })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    )
  }
}
