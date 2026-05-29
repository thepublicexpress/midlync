import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency = 'INR', plan, role, billingCycle } = body
    
    // Demo mode - return mock order
    return NextResponse.json({
      id: `order_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      notes: { plan, role, billingCycle }
    })
    
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}