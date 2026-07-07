import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAdminEmail } from '@/lib/utils/adminEmail'

const supabaseUrl = 'https://grsapzroyfcueysrmedk.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc2FwenJveWZjdWV5c3JtZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg5OTU3NiwiZXhwIjoyMDk0NDc1NTc2fQ.jeqvYugmVoR4xaQRJSgEsXUXgY-9JCPqARTy3lu8FZ0'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, manufacturerId, buyerCode, productTitle, quantity, amount } = body

    if (!manufacturerId || !buyerCode || !productTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create notification for manufacturer with buyer code only
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: manufacturerId,
        title: `🛒 New Order from ${buyerCode}`,
        message: `Order: ${orderId}\nBuyer: ${buyerCode}\nProduct: ${productTitle}\nQuantity: ${quantity}\nAmount: $${amount}`,
        type: 'order',
        related_id: orderId,
        is_read: false
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send email to manufacturer with coded information only
    await sendAdminEmail(
      `🛒 New Order for ${productTitle}`,
      `Buyer Code: ${buyerCode}\nProduct: ${productTitle}\nQuantity: ${quantity}\nAmount: $${amount}\n\nPlease review the order in your dashboard.`,
      'order'
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Manufacturer notified successfully' 
    })

  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
