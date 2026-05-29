import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { language = 'en', productIds = [] } = await request.json()
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    let query = supabase.from('products').select('id, title, category').eq('manufacturer_id', user.id)
    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds)
    }
    const { data: products } = await query
    
    if (!products || products.length === 0) {
      return NextResponse.json({ success: true, results: [] })
    }
    
    const getDescription = (title: string, category: string, lang: string) => {
      const isFabric = category?.toLowerCase().includes('fabric')
      const isGarment = category?.toLowerCase().includes('garment')
      
      if (isFabric) {
        return lang === 'hi' 
          ? `प्रीमियम गुणवत्ता ${title} फैब्रिक। उच्च ग्रेड सामग्री से बना।`
          : `Premium quality ${title} fabric. Ideal for garments. Sample available.`
      }
      if (isGarment) {
        return lang === 'hi'
          ? `उच्च गुणवत्ता ${title} परिधान। बिल्कुल सही फिट।`
          : `High-quality ${title} garment. Perfect fit. Bulk orders welcome.`
      }
      return lang === 'hi'
        ? `प्रीमियम ${title} उत्पाद। उच्च गुणवत्ता।`
        : `Premium ${title} product. High quality. Contact for quotes.`
    }
    
    const results = []
    
    for (const product of products) {
      const description = getDescription(product.title, product.category || '', language)
      
      const { data: existing } = await supabase
        .from('ai_descriptions')
        .select('id')
        .eq('product_id', product.id)
        .eq('language', language)
        .maybeSingle()
      
      if (existing) {
        await supabase.from('ai_descriptions').update({ generated_text: description }).eq('id', existing.id)
      } else {
        await supabase.from('ai_descriptions').insert({
          product_id: product.id,
          original_text: product.title,
          generated_text: description,
          language: language
        })
      }
      
      results.push({ id: product.id, title: product.title, success: true, description })
    }
    
    return NextResponse.json({ success: true, results, total: products.length })
    
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}