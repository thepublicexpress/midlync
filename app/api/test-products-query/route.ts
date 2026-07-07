import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Try the exact query from browse page
    console.log('Trying products query with manufacturer join...')
    const { data: products, error, status } = await supabase
      .from('products')
      .select('*, manufacturer:profiles!manufacturer_id(company_name, manufacturer_code)')
      .order('created_at', { ascending: false })

    console.log('Query result:', {products, error, status})

    return NextResponse.json({
      success: !error,
      productsCount: products?.length || 0,
      products: products || [],
      error: error ? {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      } : null,
      status
    })
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Error',
      stack: err instanceof Error ? err.stack : null
    }, { status: 500 })
  }
}
