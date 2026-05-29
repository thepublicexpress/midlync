import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { labelCode, productId, labelType, location } = await request.json()
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Generate or retrieve session ID
    let sessionId = request.cookies.get('scan_session')?.value
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(7)
    }
    
    // Track the scan
    await supabase.from('smart_label_sessions').insert({
      session_id: sessionId,
      buyer_id: user?.id || null,
      label_type: labelType || 'qr',
      label_code: labelCode,
      product_id: productId,
      location: location || 'showroom',
      device_info: {
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      }
    })
    
    // Add to wishlist if user is logged in
    if (user) {
      await supabase.from('buyer_wishlist').upsert({
        buyer_id: user.id,
        product_id: productId,
        added_from: 'scan'
      }, { onConflict: 'buyer_id,product_id' })
    }
    
    const response = NextResponse.json({ success: true, sessionId })
    response.cookies.set('scan_session', sessionId, { maxAge: 30 * 24 * 60 * 60 })
    
    return response
  } catch (error) {
    console.error('Track scan error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}