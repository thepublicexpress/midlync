import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://grsapzroyfcueysrmedk.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc2FwenJveWZjdWV5c3JtZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg5OTU3NiwiZXhwIjoyMDk0NDc1NTc2fQ.jeqvYugmVoR4xaQRJSgEsXUXgY-9JCPqARTy3lu8FZ0'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const buyerId = searchParams.get('buyerId')
    const role = searchParams.get('role') // 'buyer' | 'admin' | 'manufacturer'

    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        manufacturer:profiles!products_manufacturer_id_fkey (
          manufacturer_code,
          company_name,
          email
        )
      `)
      .eq('is_active', true)

    // Optional: filter by buyer-specific visibility rules
    if (buyerId) {
      // You can add region-based filters here
    }

    const { data, error } = await query

    if (error) {
      console.error('Product fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const isAdmin = role === 'admin'
    const isManufacturer = role === 'manufacturer'
    const isBuyer = role === 'buyer' || buyerId

    const transformed = data.map((product: any) => {
      const mfr = product.manufacturer || {}
      return {
        ...product,
        manufacturer_display: isBuyer
          ? mfr.manufacturer_code || 'Unknown'
          : mfr.company_name || mfr.manufacturer_code,
        manufacturer_code: mfr.manufacturer_code,
        manufacturer_name: isAdmin || isManufacturer ? mfr.company_name : undefined,
        manufacturer_email: isAdmin ? mfr.email : undefined,
      }
    })

    return NextResponse.json({ success: true, products: transformed })
  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}