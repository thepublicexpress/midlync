import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency = 'INR', plan, role, billingCycle } = body
    
    // Demo mode - no Razorpay keys required
    console.log('Creating order for demo mode:', { amount, currency, plan, role, billingCycle })
    
    // Return mock order
    return NextResponse.json({
      id: `order_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      notes: { plan, role, billingCycle }
    })
    
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}