import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAdminEmail } from '@/lib/email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Helper to ensure a profile exists for a user
async function ensureProfile(userId: string, email?: string) {
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (existing) return existing

  // Fetch user from auth to get metadata
  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
  const meta = user?.user_metadata || {}
  const role = meta.user_type || 'buyer'
  const code = role === 'manufacturer'
    ? `MFR-${Math.floor(1000000 + Math.random() * 9000000)}`
    : `BYR-${Math.floor(1000000 + Math.random() * 9000000)}`

  const profile = {
    id: userId,
    email: user?.email || email,
    role,
    company_name: meta.company_name || 'Unknown',
    is_approved: false,
    approval_status: 'pending',
    created_at: new Date().toISOString(),
    ...(role === 'manufacturer' ? { manufacturer_code: code } : { buyer_code: code }),
  }
  await supabaseAdmin.from('profiles').insert(profile)
  return profile
}

// Helper to fetch admin user IDs
async function getAdminUserIds() {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
  if (error) return []
  return data.map((d: any) => d.id)
}

// ─── POST ────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { product_id, buyer_id, message, quantity, source_role } = body
    const sourceRole = source_role === 'manufacturer' ? 'manufacturer' : 'buyer'

    // 1. Validate
    if (!product_id || !buyer_id || !message) {
      return NextResponse.json({ error: 'Product ID, Buyer ID, and message are required' }, { status: 400 })
    }

    // 2. Get product & manufacturer
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('manufacturer_id, title')
      .eq('id', product_id)
      .single()
    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    if (!product.manufacturer_id) {
      return NextResponse.json({ error: 'Product has no manufacturer' }, { status: 400 })
    }
    const inquiryManufacturerId = product.manufacturer_id

    // 3. Ensure buyer & manufacturer profiles exist
    const buyerProfile = await ensureProfile(buyer_id)
    const mfrProfile = await ensureProfile(inquiryManufacturerId)

    // 4. Insert inquiry (pending_admin)
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
      console.error('Inquiry insert error:', inquiryError)
      return NextResponse.json({ error: inquiryError.message }, { status: 500 })
    }

    // ── Notify parties ──

    if (sourceRole === 'buyer') {
      // Manufacturer gets only buyer_code
      await supabaseAdmin.from('notifications').insert({
        user_id: inquiryManufacturerId,
        title: '📩 New Inquiry from Buyer',
        message: `Buyer (${buyerProfile.buyer_code || 'BYR-CODE'}) is interested in "${product.title}". Admin will review and connect you.`,
        type: 'inquiry',
        related_id: inquiry.id,
        is_read: false,
      })
    } else {
      // Buyer gets only manufacturer_code
      await supabaseAdmin.from('notifications').insert({
        user_id: buyer_id,
        title: '📩 New Inquiry from Manufacturer',
        message: `Manufacturer (${mfrProfile.manufacturer_code || 'MFR-CODE'}) has reached out regarding "${product.title}". Admin will coordinate.`,
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
          ? `📨 New Buyer Inquiry (${buyerProfile.buyer_code || 'BYR'} → ${mfrProfile.manufacturer_code || 'MFR'})`
          : `📨 New Manufacturer Inquiry (${mfrProfile.manufacturer_code || 'MFR'} → ${buyerProfile.buyer_code || 'BYR'})`,
        message: `
Product: ${product.title}
${sourceRole === 'buyer' ? 'Buyer' : 'Manufacturer'}: ${buyerProfile.company_name} (${buyerProfile.buyer_code})
${sourceRole === 'buyer' ? 'Manufacturer' : 'Buyer'}: ${mfrProfile.company_name} (${mfrProfile.manufacturer_code})
Message: ${message}
Quantity: ${quantity || 'N/A'}
        `.trim(),
        type: 'inquiry',
        related_id: inquiry.id,
        is_read: false,
      }))
      await supabaseAdmin.from('notifications').insert(adminNotifs)
    }

    // ── Send email to info@midlync.com ──
    const adminEmailSubject = sourceRole === 'buyer'
      ? `📨 New Buyer Inquiry: ${product.title}`
      : `📨 New Manufacturer Inquiry: ${product.title}`

    const adminEmailHtml = `
      <h2>New Inquiry Received</h2>
      <p><strong>Product:</strong> ${product.title}</p>
      <p><strong>${sourceRole === 'buyer' ? 'Buyer' : 'Manufacturer'}:</strong> 
        ${buyerProfile.company_name} (${buyerProfile.buyer_code})
      </p>
      <p><strong>${sourceRole === 'buyer' ? 'Manufacturer' : 'Buyer'}:</strong> 
        ${mfrProfile.company_name} (${mfrProfile.manufacturer_code})
      </p>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>Quantity:</strong> ${quantity || 'N/A'}</p>
      <p><a href="${process.env.NEXTAUTH_URL || 'https://midlync.com'}/admin/inquiries">View in Admin Dashboard</a></p>
    `
    await sendAdminEmail(adminEmailSubject, adminEmailHtml)

    return NextResponse.json({
      success: true,
      inquiry,
      message: sourceRole === 'buyer'
        ? 'Inquiry sent! Admin will review and connect you with the manufacturer.'
        : 'Inquiry sent! Admin will review and connect you with the buyer.'
    })

  } catch (error: any) {
    console.error('Inquiry error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── GET (same as before) ────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
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

    if (role === 'buyer') query = query.eq('buyer_id', userId)
    else if (role === 'manufacturer') query = query.eq('manufacturer_id', userId)
    // if admin, no filter

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) {
      console.error('Inquiry fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, inquiries: data })
  } catch (error: any) {
    console.error('Fetch inquiries error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}