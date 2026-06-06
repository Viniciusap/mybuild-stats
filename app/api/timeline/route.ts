import { NextResponse } from 'next/server'
import { getBuildEvents, saveBuildEvent } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BuildEventSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  component: z.string().min(1).max(200),
  eventType: z.enum(['added', 'removed', 'upgraded', 'repaired', 'driver_update']),
  notes: z.string().max(2000),
  price: z.number().positive().optional(),
})

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
    const parsed = BuildEventSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const id = saveBuildEvent(parsed.data)
    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    console.error('[api/timeline POST]', err)
    return NextResponse.json({ error: 'Failed to save event' }, { status: 500 })
  }
}
