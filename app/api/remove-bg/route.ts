import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, limit = 10 } = body
    
    console.log('Search query:', query)
    
    if (!query || query.trim() === '') {
      return NextResponse.json({ success: true, matches: [] })
    }
    
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, description, category, fabric_type, color, price_per_unit, image_url, images')
      .eq('manufacturer_id', user.id)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,fabric_type.ilike.%${query}%,color.ilike.%${query}%`)
      .limit(limit)
    
    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    
    console.log('Found products:', products?.length)
    
    return NextResponse.json({
      success: true,
      matches: products || [],
      total: products?.length || 0
    })
    
  } catch (error) {
    console.error('Product matching error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}