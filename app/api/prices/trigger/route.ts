import { NextResponse } from 'next/server'
import { checkAllTargetPrices } from '@/lib/prices'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  try {
    await checkAllTargetPrices()
    return NextResponse.json({ ok: true, message: 'Price check triggered.' })
  } catch (err) {
    console.error('[api/prices/trigger]', err)
    return NextResponse.json({ error: 'Price check failed' }, { status: 500 })
  }
}
