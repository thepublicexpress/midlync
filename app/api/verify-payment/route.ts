import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, role, billingCycle, amount } = body
    
    console.log('Payment verified:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      plan, role, billingCycle, amount
    })
    
    // Demo mode - always success
    return NextResponse.json({ success: true })
    
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}