import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://grsapzroyfcueysrmedk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc2FwenJveWZjdWV5c3JtZWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTk1NzYsImV4cCI6MjA5NDQ3NTU3Nn0.gtqvftPExberQ89GDgqVaddu7aeq_F36j7IsHYWY4mk'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc2FwenJveWZjdWV5c3JtZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg5OTU3NiwiZXhwIjoyMDk0NDc1NTc2fQ.jeqvYugmVoR4xaQRJSgEsXUXgY-9JCPqARTy3lu8FZ0'

// Admin client - bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { product_id, buyer_id, message, quantity } = body
    
    console.log('📩 Received inquiry request:', { product_id, buyer_id, message: message?.substring(0, 50), quantity })
    
    // Check required fields
    if (!product_id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }
    
    if (!buyer_id) {
      return NextResponse.json({ error: 'Buyer ID required. Please login again.' }, { status: 400 })
    }
    
    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }
    
    // ✅ Get product details to find manufacturer_id (from products table)
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('manufacturer_id, title')
      .eq('id', product_id)
      .single()
    
    if (productError || !product) {
      console.error('❌ Product error:', productError)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    console.log('✅ Product found:', product.title)
    console.log('   Manufacturer ID:', product.manufacturer_id)
    
    // Check if product has a manufacturer
    if (!product.manufacturer_id) {
      console.error('❌ Product has no manufacturer_id')
      return NextResponse.json({ error: 'Product has no manufacturer assigned' }, { status: 400 })
    }
    
    // ✅ Insert inquiry with manufacturer_id from product (NOT from buyer)
    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from('product_inquiries')
      .insert({
        product_id: product_id,
        buyer_id: buyer_id,
        manufacturer_id: product.manufacturer_id,  // ✅ Using product's manufacturer_id
        message: message,
        quantity: quantity || null,
        status: 'pending'
      })
      .select()
      .single()
    
    if (inquiryError) {
      console.error('❌ Inquiry insert error:', inquiryError)
      return NextResponse.json({ error: inquiryError.message }, { status: 500 })
    }
    
    console.log('✅ Inquiry inserted:', inquiry.id)
    
    // Get buyer code and manufacturer code for admin notification
    const { data: buyerProfile } = await supabaseAdmin
      .from('profiles')
      .select('buyer_code')
      .eq('id', buyer_id)
      .single()

    const { data: mfrProfile } = await supabaseAdmin
      .from('profiles')
      .select('manufacturer_code')
      .eq('id', product.manufacturer_id)
      .single()
    
    // ✅ Send notification to manufacturer
    const { data: notification, error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: product.manufacturer_id,
        title: '📩 New Product Inquiry',
        message: `New inquiry for "${product.title}". Click to view details.`,
        type: 'inquiry',
        related_id: inquiry.id,
        is_read: false
      })
      .select()
      .single()
    
    if (notifError) {
      console.error('❌ Notification error:', notifError)
    } else {
      console.log('✅ Notification sent to manufacturer:', product.manufacturer_id)
    }

    // Send admin notification with buyer and manufacturer codes
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'admin',
          title: `📨 New Inquiry from ${buyerProfile?.buyer_code || 'Buyer'}`,
          message: message,
          type: 'inquiry',
          relatedId: inquiry.id,
          buyerCode: buyerProfile?.buyer_code,
          manufacturerCode: mfrProfile?.manufacturer_code,
          productTitle: product.title,
          quantity: quantity
        })
      })
    } catch (adminNotifError) {
      console.error('Error sending admin notification:', adminNotifError)
    }
    
    return NextResponse.json({ 
      success: true, 
      inquiry,
      notification: notification,
      message: 'Inquiry sent successfully! Manufacturer will be notified.'
    })
    
  } catch (error) {
    console.error('❌ Server error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    let inquiries
    
    if (role === 'manufacturer') {
      // Get inquiries for manufacturer
      const { data, error } = await supabaseAdmin
        .from('product_inquiries')
        .select('*, products(title), buyer:profiles!buyer_id(company_name, email)')
        .eq('manufacturer_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      inquiries = data
    } else {
      // Get inquiries for buyer
      const { data, error } = await supabaseAdmin
        .from('product_inquiries')
        .select('*, products(title), manufacturer:profiles!manufacturer_id(company_name)')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      inquiries = data
    }
    
    return NextResponse.json({ success: true, inquiries })
    
  } catch (error) {
    console.error('Error fetching inquiries:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}