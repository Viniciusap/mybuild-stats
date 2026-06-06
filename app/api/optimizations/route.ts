import { NextResponse } from 'next/server'
import { runOptimizationChecks } from '@/lib/optimizations'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await runOptimizationChecks()
    return NextResponse.json(result)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Failed to run optimization checks', details: msg }, { status: 500 })
  }
}

export async function POST() {
  try {
    const result = await runOptimizationChecks(true)
    return NextResponse.json(result)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Failed to refresh checks', details: msg }, { status: 500 })
  }
}
