import { NextResponse } from 'next/server'
import { collectHardwareInfo, detectHardwareChanges } from '@/lib/hardware'
import { saveSnapshot, getLatestSnapshot } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  try {
    const current = await collectHardwareInfo()
    const previous = getLatestSnapshot()
    const changed = previous ? detectHardwareChanges(current, previous) : true
    const id = saveSnapshot(current)
    return NextResponse.json({ id, changed, timestamp: current.timestamp })
  } catch (err) {
    console.error('[api/snapshot]', err)
    return NextResponse.json({ error: 'Snapshot failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const latest = getLatestSnapshot()
    if (!latest) return NextResponse.json({ snapshot: null })
    return NextResponse.json({ snapshot: latest })
  } catch (err) {
    console.error('[api/snapshot]', err)
    return NextResponse.json({ error: 'Failed to read snapshot' }, { status: 500 })
  }
}
