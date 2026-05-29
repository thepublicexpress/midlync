import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://grsapzroyfcueysrmedk.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc2FwenJveWZjdWV5c3JtZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg5OTU3NiwiZXhwIjoyMDk0NDc1NTc2fQ.jeqvYugmVoR4xaQRJSgEsXUXgY-9JCPqARTy3lu8FZ0'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const stageNames = {
  1: 'Order Placed',
  2: 'Confirmed',
  3: 'Processing',
  4: 'Shipped',
  5: 'Delivered',
  6: 'Cancelled'
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, stage, tracking_number, tracking_url, estimated_delivery, manufacturer_notes } = body
    
    // Get current user
    const supabase = createClient(
      supabaseUrl,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc2FwenJveWZjdWV5c3JtZWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTk1NzYsImV4cCI6MjA5NDQ3NTU3Nn0.gtqvftPExberQ89GDgqVaddu7aeq_F36j7IsHYWY4mk'
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, buyer:profiles!buyer_id(id, email, company_name), products(title)')
      .eq('id', orderId)
      .single()
    
    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    // Update order
    const updateData: any = { stage, updated_at: new Date().toISOString() }
    if (tracking_number) updateData.tracking_number = tracking_number
    if (tracking_url) updateData.tracking_url = tracking_url
    if (estimated_delivery) updateData.estimated_delivery = estimated_delivery
    if (manufacturer_notes) updateData.manufacturer_notes = manufacturer_notes
    
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()
    
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    // Add to tracking history
    await supabaseAdmin
      .from('order_tracking')
      .insert({
        order_id: orderId,
        status: stageNames[stage] || `Stage ${stage}`,
        note: manufacturer_notes || `Order status updated to ${stageNames[stage]}`,
        updated_by: user.id
      })
    
    // Send notification to buyer
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: order.buyer_id,
        title: `📦 Order Update: ${stageNames[stage]}`,
        message: `Your order #${order.order_number?.slice(0, 8)} for "${order.products?.title}" has been ${stageNames[stage]?.toLowerCase()}. ${tracking_number ? `Tracking: ${tracking_number}` : ''}`,
        type: 'order',
        related_id: orderId,
        is_read: false
      })
    
    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      message: `Order updated to ${stageNames[stage]}`
    })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}