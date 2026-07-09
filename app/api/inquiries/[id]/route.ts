import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAdminEmail } from '@/lib/email'

const supabaseUrl = 'https://grsapzroyfcueysrmedk.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc2FwenJveWZjdWV5c3JtZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg5OTU3NiwiZXhwIjoyMDk0NDc1NTc2fQ.jeqvYugmVoR4xaQRJSgEsXUXgY-9JCPqARTy3lu8FZ0'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// ─── GET Inquiry Details ────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: inquiry, error } = await supabaseAdmin
      .from('product_inquiries')
      .select(`
        *,
        buyer:profiles!buyer_id(
          id, company_name, email, buyer_code
        ),
        manufacturer:profiles!manufacturer_id(
          id, company_name, email, manufacturer_code
        ),
        product:products(title, sku)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, inquiry })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// ─── PATCH: Admin Approve / Reject ──────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const action = body?.action

    if (action !== 'approve_connection' && action !== 'reject_connection') {
      return NextResponse.json({ error: 'Invalid action. Use approve_connection or reject_connection.' }, { status: 400 })
    }

    // 1. Fetch inquiry with buyer and manufacturer profiles
    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from('product_inquiries')
      .select(`
        id,
        buyer_id,
        manufacturer_id,
        product_id,
        status,
        buyer:profiles!buyer_id(
          buyer_code,
          company_name,
          email
        ),
        manufacturer:profiles!manufacturer_id(
          manufacturer_code,
          company_name,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (inquiryError || !inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // 2. Check existing connection grant
    const { data: existingGrant } = await supabaseAdmin
      .from('connection_grants')
      .select('id, status')
      .eq('buyer_id', inquiry.buyer_id)
      .eq('manufacturer_id', inquiry.manufacturer_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 3. Handle APPROVAL
    if (action === 'approve_connection') {
      // Update or create active connection grant
      if (existingGrant) {
        await supabaseAdmin
          .from('connection_grants')
          .update({ status: 'active' })
          .eq('id', existingGrant.id)
      } else {
        await supabaseAdmin
          .from('connection_grants')
          .insert({
            buyer_id: inquiry.buyer_id,
            manufacturer_id: inquiry.manufacturer_id,
            status: 'active',
          })
      }

      // Update inquiry status
      await supabaseAdmin
        .from('product_inquiries')
        .update({ status: 'connected', updated_at: new Date().toISOString() })
        .eq('id', id)

      // ── Send approval notifications with CODES ──
      const buyerCode = inquiry.buyer?.buyer_code || 'Buyer'
      const mfrCode = inquiry.manufacturer?.manufacturer_code || 'Manufacturer'

      await supabaseAdmin.from('notifications').insert([
        {
          user_id: inquiry.buyer_id,
          title: '✅ Connection Approved by Admin',
          message: `Admin approved your inquiry. You are now connected with manufacturer **${mfrCode}**.`,
          type: 'connection',
          related_id: id,
          is_read: false,
        },
        {
          user_id: inquiry.manufacturer_id,
          title: '✅ Connection Approved by Admin',
          message: `Admin approved this inquiry. You are now connected with buyer **${buyerCode}**.`,
          type: 'connection',
          related_id: id,
          is_read: false,
        },
      ])

      // ── Send admin email notification ──
      const subject = '✅ Connection Approved'
      const html = `
        <h2>Connection Approved</h2>
        <p><strong>Buyer:</strong> ${inquiry.buyer.company_name} (${inquiry.buyer.buyer_code})</p>
        <p><strong>Manufacturer:</strong> ${inquiry.manufacturer.company_name} (${inquiry.manufacturer.manufacturer_code})</p>
        <p>They are now connected.</p>
      `
      sendAdminEmail(subject, html)

      return NextResponse.json({ success: true, status: 'active' })
    }

    // 4. Handle REJECTION
    if (existingGrant) {
      await supabaseAdmin
        .from('connection_grants')
        .update({ status: 'rejected' })
        .eq('id', existingGrant.id)
    }

    await supabaseAdmin
      .from('product_inquiries')
      .update({ status: 'admin_rejected', updated_at: new Date().toISOString() })
      .eq('id', id)

    // ── Send rejection notifications with CODES ──
    const buyerCode = inquiry.buyer?.buyer_code || 'Buyer'
    const mfrCode = inquiry.manufacturer?.manufacturer_code || 'Manufacturer'

    await supabaseAdmin.from('notifications').insert([
      {
        user_id: inquiry.buyer_id,
        title: '❌ Connection Rejected by Admin',
        message: `Admin could not approve your connection request with manufacturer **${mfrCode}**.`,
        type: 'connection',
        related_id: id,
        is_read: false,
      },
      {
        user_id: inquiry.manufacturer_id,
        title: '❌ Connection Rejected by Admin',
        message: `Admin could not approve your connection request with buyer **${buyerCode}**.`,
        type: 'connection',
        related_id: id,
        is_read: false,
      },
    ])

    // ── Send admin email notification ──
    const subject = '❌ Connection Rejected'
    const html = `
      <h2>Connection Rejected</h2>
      <p><strong>Buyer:</strong> ${inquiry.buyer.company_name} (${inquiry.buyer.buyer_code})</p>
      <p><strong>Manufacturer:</strong> ${inquiry.manufacturer.company_name} (${inquiry.manufacturer.manufacturer_code})</p>
      <p>Admin rejected the connection request.</p>
    `
    sendAdminEmail(subject, html)

    return NextResponse.json({ success: true, status: 'rejected' })

  } catch (error) {
    console.error('❌ Approval error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}