import { NextResponse } from 'next/server'
import { getLatestPrices, getPriceHistory } from '@/lib/db'
import { buildPriceAlerts } from '@/lib/prices'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const componentId = searchParams.get('componentId')

    if (componentId) {
      const days = parseInt(searchParams.get('days') ?? '30', 10)
      const history = getPriceHistory(componentId, days)
      return NextResponse.json({ history })
    }

    const latest = getLatestPrices()
    const alerts = buildPriceAlerts()
    return NextResponse.json({ prices: latest, alerts })
  } catch (err) {
    console.error('[api/prices]', err)
    return NextResponse.json({ error: 'Failed to get prices' }, { status: 500 })
  }
}
