import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAdminEmail } from '@/lib/email'

const supabaseUrl = 'https://grsapzroyfcueysrmedk.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc2FwenJveWZjdWV5c3JtZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg5OTU3NiwiZXhwIjoyMDk0NDc1NTc2fQ.jeqvYugmVoR4xaQRJSgEsXUXgY-9JCPqARTy3lu8FZ0'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Helper to fetch admin user IDs
async function getAdminUserIds() {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('user_type', 'agency')
  if (error) {
    console.error('Error fetching admins:', error)
    return []
  }
  return data.map((d: any) => d.id)
}

// Helper to ensure pending connection grant
async function ensurePendingConnectionGrant(buyerId: string, manufacturerId: string) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('connection_grants')
    .select('id, status')
    .eq('buyer_id', buyerId)
    .eq('manufacturer_id', manufacturerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) {
    console.error('⚠️ Failed to check existing connection grant:', existingError)
    return
  }

  if (!existing) {
    const { error: insertError } = await supabaseAdmin
      .from('connection_grants')
      .insert({
        buyer_id: buyerId,
        manufacturer_id: manufacturerId,
        status: 'pending',
      })
    if (insertError) {
      console.error('⚠️ Failed to create pending connection grant:', insertError)
    }
    return
  }

  if (existing.status !== 'active') {
    const { error: updateError } = await supabaseAdmin
      .from('connection_grants')
      .update({ status: 'pending' })
      .eq('id', existing.id)
    if (updateError) {
      console.error('⚠️ Failed to update connection grant to pending:', updateError)
    }
  }
}

// ─── POST ────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { product_id, buyer_id, manufacturer_id, message, quantity, source_role } = body
    const sourceRole = source_role === 'manufacturer' ? 'manufacturer' : 'buyer'

    console.log('📩 Received inquiry request:', { product_id, buyer_id, message: message?.substring(0, 50), quantity })

    // Validation
    if (!product_id || !buyer_id || !message) {
      return NextResponse.json({ error: 'Product ID, Buyer ID, and message are required' }, { status: 400 })
    }

    // Get product and its manufacturer
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('manufacturer_id, title')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      console.error('❌ Product error:', productError)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.manufacturer_id) {
      return NextResponse.json({ error: 'Product has no manufacturer' }, { status: 400 })
    }

    // If manufacturer is sending, ensure they are the product owner
    if (sourceRole === 'manufacturer' && manufacturer_id && manufacturer_id !== product.manufacturer_id) {
      return NextResponse.json({ error: 'Product does not belong to this manufacturer' }, { status: 400 })
    }

    const inquiryManufacturerId = product.manufacturer_id
    await ensurePendingConnectionGrant(buyer_id, inquiryManufacturerId)

    // Get buyer & manufacturer profiles (for codes and names)
    const { data: buyerProfile } = await supabaseAdmin
      .from('profiles')
      .select('buyer_code, company_name, email')
      .eq('id', buyer_id)
      .single()

    const { data: mfrProfile } = await supabaseAdmin
      .from('profiles')
      .select('manufacturer_code, company_name, email')
      .eq('id', inquiryManufacturerId)
      .single()

    if (!buyerProfile || !mfrProfile) {
      return NextResponse.json({ error: 'Buyer or manufacturer profile not found' }, { status: 404 })
    }

    // Insert inquiry with status 'pending_admin'
    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from('product_inquiries')
      .insert({
        product_id,
        buyer_id,
        manufacturer_id: inquiryManufacturerId,
        message,
        quantity: quantity || null,
        status: 'pending_admin'
      })
      .select()
      .single()

    if (inquiryError) {
      console.error('❌ Inquiry insert error:', inquiryError)
      return NextResponse.json({ error: inquiryError.message }, { status: 500 })
    }

    console.log('✅ Inquiry inserted:', inquiry.id)

    // ── Send notifications with ANONYMITY ──

    if (sourceRole === 'buyer') {
      // Buyer sent → notify manufacturer (show buyer_code only)
      await supabaseAdmin.from('notifications').insert({
        user_id: inquiryManufacturerId,
        title: '📩 New Inquiry from Buyer',
        message: `Buyer (${buyerProfile.buyer_code}) is interested in "${product.title}". Admin will review and connect you.`,
        type: 'inquiry',
        related_id: inquiry.id,
        is_read: false,
      })
    } else {
      // Manufacturer sent → notify buyer (show manufacturer_code only)
      await supabaseAdmin.from('notifications').insert({
        user_id: buyer_id,
        title: '📩 New Inquiry from Manufacturer',
        message: `Manufacturer (${mfrProfile.manufacturer_code}) has reached out regarding "${product.title}". Admin will coordinate.`,
        type: 'inquiry',
        related_id: inquiry.id,
        is_read: false,
      })
    }

    // ── Notify all admins with FULL details ──
    const adminIds = await getAdminUserIds()
    if (adminIds.length > 0) {
      const adminNotifs = adminIds.map((adminId: string) => ({
        user_id: adminId,
        title: sourceRole === 'buyer'
          ? `📨 New Buyer Inquiry (${buyerProfile.buyer_code} → ${mfrProfile.manufacturer_code})`
          : `📨 New Manufacturer Inquiry (${mfrProfile.manufacturer_code} → ${buyerProfile.buyer_code})`,
        message: `
          Product: ${product.title}
          ${sourceRole === 'buyer' ? 'Buyer' : 'Manufacturer'}: ${sourceRole === 'buyer' ? buyerProfile.company_name : mfrProfile.company_name} (${sourceRole === 'buyer' ? buyerProfile.buyer_code : mfrProfile.manufacturer_code})
          ${sourceRole === 'buyer' ? 'Manufacturer' : 'Buyer'}: ${sourceRole === 'buyer' ? mfrProfile.company_name : buyerProfile.company_name} (${sourceRole === 'buyer' ? mfrProfile.manufacturer_code : buyerProfile.buyer_code})
          Message: ${message}
          Quantity: ${quantity || 'N/A'}
        `.trim(),
        type: 'inquiry',
        related_id: inquiry.id,
        is_read: false,
      }))
      await supabaseAdmin.from('notifications').insert(adminNotifs)
    }

    // ── Send admin email ──
    const adminEmailSubject = sourceRole === 'buyer'
      ? `📨 New Buyer Inquiry: ${product.title}`
      : `📨 New Manufacturer Inquiry: ${product.title}`

    const adminEmailHtml = `
      <h2>New Inquiry Received</h2>
      <p><strong>Product:</strong> ${product.title}</p>
      <p><strong>${sourceRole === 'buyer' ? 'Buyer' : 'Manufacturer'}:</strong> 
        ${sourceRole === 'buyer' ? buyerProfile.company_name : mfrProfile.company_name} 
        (${sourceRole === 'buyer' ? buyerProfile.buyer_code : mfrProfile.manufacturer_code})
      </p>
      <p><strong>${sourceRole === 'buyer' ? 'Manufacturer' : 'Buyer'}:</strong> 
        ${sourceRole === 'buyer' ? mfrProfile.company_name : buyerProfile.company_name} 
        (${sourceRole === 'buyer' ? mfrProfile.manufacturer_code : buyerProfile.buyer_code})
      </p>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>Quantity:</strong> ${quantity || 'N/A'}</p>
      <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/inquiries">View in Admin Dashboard</a></p>
    `
    // Don't await – fire and forget
    sendAdminEmail(adminEmailSubject, adminEmailHtml)

    return NextResponse.json({
      success: true,
      inquiry,
      message: sourceRole === 'buyer'
        ? 'Inquiry sent! Admin will review and connect you with the manufacturer.'
        : 'Inquiry sent! Admin will review and connect you with the buyer.'
    })

  } catch (error) {
    console.error('❌ Server error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// ─── GET ─────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role') // 'buyer' | 'manufacturer' | 'admin'

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    let query = supabaseAdmin
      .from('product_inquiries')
      .select(`
        *,
        product:products(title, sku),
        buyer:profiles!buyer_id(company_name, email, buyer_code),
        manufacturer:profiles!manufacturer_id(company_name, email, manufacturer_code)
      `)

    if (role === 'buyer') {
      query = query.eq('buyer_id', userId)
    } else if (role === 'manufacturer') {
      query = query.eq('manufacturer_id', userId)
    }
    // if admin, no filter – show all

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Inquiry fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, inquiries: data })
  } catch (error) {
    console.error('Error fetching inquiries:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}