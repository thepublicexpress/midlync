import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const mockDescriptions = {
  en: {
    fabric: "Premium quality fabric with excellent durability and soft texture. Ideal for various applications.",
    garment: "High-quality garment with superior craftsmanship and modern design.",
    default: "Premium product with excellent quality and competitive pricing."
  },
  hi: {
    fabric: "प्रीमियम गुणवत्ता वाला कपड़ा, टिकाऊ और मुलायम बनावट के साथ।",
    garment: "उच्च गुणवत्ता वाला परिधान, बेहतर शिल्प कौशल और आधुनिक डिजाइन के साथ।",
    default: "बेहतरीन गुणवत्ता और प्रतिस्पर्धी मूल्य वाला प्रीमियम उत्पाद।"
  }
}

type Language = 'en' | 'hi'
type CategoryType = 'fabric' | 'garment' | 'default'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, productTitle, productCategory, language = 'en' } = body
    
    let categoryType: CategoryType = 'default'
    if (productCategory?.toLowerCase().includes('fabric')) categoryType = 'fabric'
    else if (productCategory?.toLowerCase().includes('garment')) categoryType = 'garment'
    
    const lang = language as Language
    const description = mockDescriptions[lang]?.[categoryType] || mockDescriptions.en.default
    
    if (productId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await supabase.from('products').update({ 
        ai_description: description,
        description_updated_at: new Date().toISOString()
      }).eq('id', productId)
    }
    
    return NextResponse.json({ 
      success: true, 
      description: description,
      language: lang,
      category: categoryType
    })
    
  } catch (error) {
    console.error('AI Catalogue error:', error)
    return NextResponse.json({ 
      error: (error as Error).message 
    }, { status: 500 })
  }
}