import { NextResponse } from 'next/server'
import { getBuildEvents, saveBuildEvent } from '@/lib/db'
import type { BuildEvent } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const events = getBuildEvents()
    return NextResponse.json({ events })
  } catch (err) {
    console.error('[api/timeline]', err)
    return NextResponse.json({ error: 'Failed to get events' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Omit<BuildEvent, 'id'>
    const id = saveBuildEvent(body)
    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    console.error('[api/timeline POST]', err)
    return NextResponse.json({ error: 'Failed to save event' }, { status: 500 })
  }
}
