import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAdminEmail } from '@/lib/utils/adminEmail'

const supabaseUrl = 'https://grsapzroyfcueysrmedk.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc2FwenJveWZjdWV5c3JtZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg5OTU3NiwiZXhwIjoyMDk0NDc1NTc2fQ.jeqvYugmVoR4xaQRJSgEsXUXgY-9JCPqARTy3lu8FZ0'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0 })
    }
    
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    const { count: unreadCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    
    if (error) {
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0 })
    }
    
    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount: unreadCount || 0
    })
    
  } catch (error) {
    return NextResponse.json({ success: true, notifications: [], unreadCount: 0 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, message, type, relatedId, buyerCode, manufacturerCode, productTitle, quantity } = body
    
    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type: type || 'order',
        related_id: relatedId,
        is_read: false
      })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send admin notification for important events
    if (type === 'inquiry' && buyerCode && manufacturerCode) {
      await sendAdminEmail(
        `📨 New Inquiry from ${buyerCode}`,
        `Buyer Code: ${buyerCode}\nProduct: ${productTitle}\nManufacturer Code: ${manufacturerCode}\nQuantity: ${quantity}\n\nMessage: ${message}`,
        'inquiry'
      )
    } else if (type === 'order' && buyerCode && manufacturerCode) {
      await sendAdminEmail(
        `🛒 New Order from ${buyerCode}`,
        `Buyer Code: ${buyerCode}\nManufacturer Code: ${manufacturerCode}\nOrder ID: ${relatedId}\n\nDetails: ${message}`,
        'order'
      )
    } else if (type === 'wishlist' && buyerCode && productTitle) {
      await sendAdminEmail(
        `📌 Buyer Liked Product: ${productTitle}`,
        `Buyer Code: ${buyerCode}\nProduct: ${productTitle}\nManufacturer Code: ${manufacturerCode || 'N/A'}`,
        'wishlist'
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}