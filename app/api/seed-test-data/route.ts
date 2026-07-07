import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sb-grsapzroyfcueysrmedk.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiLWdyc2FwenJveWZjdWV5c3JtZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMTAyODM5MCwiZXhwIjoxODY4Nzk0MzkwfQ.sLYL3OZEfEfH1s2XqPrL9SHaLJ1VRBPQaLb_FdAKPLI'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting data seeding...')
    
    // Check if manufacturer already exists
    const { data: existingMfr } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', '550e8400-e29b-41d4-a716-446655440001')
      .single()
    
    if (existingMfr) {
      console.log('✅ Manufacturer already exists')
      return NextResponse.json({
        success: true,
        message: 'Data already exists'
      })
    }

    // Create manufacturer
    console.log('📦 Creating manufacturer...')
    const { data: mfr, error: mfrError } = await supabase
      .from('profiles')
      .insert({
        id: '550e8400-e29b-41d4-a716-446655440001',
        role: 'manufacturer',
        company_name: 'TechCo Manufacturing Ltd',
        email: 'tech@mfr.com',
        is_approved: true,
        approval_status: 'approved',
        manufacturer_code: 'MFR-TECH001',
        subscription_plan: 'premium'
      })
      .select()

    if (mfrError) {
      console.error('❌ Manufacturer error:', mfrError)
      throw mfrError
    }

    console.log('✅ Manufacturer created:', mfr)

    // Create products
    console.log('📦 Creating products...')
    const { data: products, error: prodError } = await supabase
      .from('products')
      .insert([
        {
          title: 'Industrial Motor 5HP',
          description: 'Heavy-duty industrial motor for manufacturing',
          manufacturer_id: '550e8400-e29b-41d4-a716-446655440001',
          category: 'Motors',
          price_per_unit: 15000,
          currency: 'INR',
          moq: 1,
          unit: 'pcs',
          status: 'active'
        },
        {
          title: 'Steel Bearings Set',
          description: 'Premium quality steel bearings',
          manufacturer_id: '550e8400-e29b-41d4-a716-446655440001',
          category: 'Components',
          price_per_unit: 2500,
          currency: 'INR',
          moq: 10,
          unit: 'pcs',
          status: 'active'
        },
        {
          title: 'Hydraulic Pump 50cc',
          description: 'Professional grade hydraulic pump',
          manufacturer_id: '550e8400-e29b-41d4-a716-446655440001',
          category: 'Pumps',
          price_per_unit: 8500,
          currency: 'INR',
          moq: 2,
          unit: 'pcs',
          status: 'active'
        }
      ])
      .select()

    if (prodError) {
      console.error('❌ Products error:', prodError)
      throw prodError
    }

    console.log('✅ Products created:', products?.length)

    // Create buyer
    console.log('📦 Creating buyer...')
    const { data: buyer, error: buyerError } = await supabase
      .from('profiles')
      .insert({
        id: '550e8400-e29b-41d4-a716-446655440002',
        role: 'buyer',
        company_name: 'Global Trade Co',
        email: 'buyer@trade.com',
        is_approved: true,
        approval_status: 'approved',
        buyer_code: 'BYR-TRADE001',
        subscription_plan: 'basic'
      })
      .select()

    if (buyerError) {
      console.error('❌ Buyer error:', buyerError)
      throw buyerError
    }

    console.log('✅ Buyer created:', buyer)

    return NextResponse.json({
      success: true,
      message: 'Test data seeded successfully!',
      data: {
        manufacturer: mfr?.[0],
        productsCount: products?.length,
        buyer: buyer?.[0]
      }
    })
  } catch (error) {
    console.error('❌ Seed error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      },
      { status: 500 }
    )
  }
}
