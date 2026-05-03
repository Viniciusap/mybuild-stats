import { NextResponse } from 'next/server'
import { collectHardwareInfo } from '@/lib/hardware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await collectHardwareInfo()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/hardware]', err)
    return NextResponse.json(
      { error: 'Failed to collect hardware info' },
      { status: 500 }
    )
  }
}
