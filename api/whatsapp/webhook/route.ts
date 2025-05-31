import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Verify webhook signature
    // Process incoming message
    // Store in database
    
    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
} 