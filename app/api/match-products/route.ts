import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, limit = 10 } = body
    
    if (!query || query.trim() === '') {
      return NextResponse.json({ success: true, matches: [] })
    }
    
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }
    
    const searchTerm = query.trim()
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, description, category, fabric_type, color, price_per_unit, image_url, images')
      .eq('manufacturer_id', user.id)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,fabric_type.ilike.%${searchTerm}%,color.ilike.%${searchTerm}%`)
      .limit(limit)
    
    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    
    // Log the results for debugging
    console.log('Match results found:', products?.length)
    
    return NextResponse.json({
      success: true,
      matches: products || [],
      total: products?.length || 0
    })
    
  } catch (error) {
    console.error('Product matching error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}