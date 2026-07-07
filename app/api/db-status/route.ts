import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get all products with manufacturer info
    const { data: products } = await supabase
      .from('products')
      .select('id, title, category, price_per_unit, status, manufacturer_id')

    // Get all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, company_name, role, email, manufacturer_code, buyer_code')

    // Get all orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id, buyer_id, status')

    return NextResponse.json({
      summary: {
        products: products?.length || 0,
        profiles: profiles?.length || 0,
        orders: orders?.length || 0
      },
      data: {
        products: products || [],
        profiles: profiles || [],
        orders: orders || []
      }
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
