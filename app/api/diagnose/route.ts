import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint is for testing/debugging only
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        error: 'Missing Supabase credentials'
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Test 1: Try to query products
    console.log('📊 Testing products query...')
    const { data: products, error: prodError, status: prodStatus } = await supabase
      .from('products')
      .select('id, title, price_per_unit, manufacturer_id')
      .limit(5)

    console.log('Products query:', { productsCount: products?.length, error: prodError, status: prodStatus })

    // Test 2: Try to query profiles
    console.log('📊 Testing profiles query...')
    const { data: profiles, error: profError, status: profStatus } = await supabase
      .from('profiles')
      .select('id, company_name, role')
      .limit(5)

    console.log('Profiles query:', { profilesCount: profiles?.length, error: profError, status: profStatus })

    // Test 3: Try authentication
    console.log('📊 Testing auth...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth:', { user: user?.id || 'none', error: authError })

    return NextResponse.json({
      supabaseUrl,
      anonKeyPrefix: supabaseAnonKey.substring(0, 20) + '...',
      tests: {
        products: {
          status: prodStatus,
          count: products?.length || 0,
          error: prodError ? { message: prodError.message, code: prodError.code } : null
        },
        profiles: {
          status: profStatus,
          count: profiles?.length || 0,
          error: profError ? { message: profError.message, code: prodError.code } : null
        },
        auth: {
          authenticated: !!user,
          error: authError ? { message: authError.message, code: authError.code } : null
        }
      }
    })
  } catch (err) {
    console.error('❌ Diagnostic error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : null
    }, { status: 500 })
  }
}
