import { NextRequest, NextResponse } from 'next/server'
import { whatsappApi } from '@/lib/whatsapp-api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (!mode || !token || !challenge) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  try {
    await whatsappApi.verifyWebhook(mode, token, challenge)
    return new NextResponse(challenge, { status: 200 })
  } catch (error) {
    console.error('Webhook verification failed:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    await whatsappApi.handleWebhook(payload)
    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook handling failed:', error)
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 })
  }
} 