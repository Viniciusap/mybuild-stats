import { NextRequest, NextResponse } from 'next/server'
import { readHistory } from '@/lib/automation-history'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get('taskId') ?? undefined
  const runs = await readHistory(taskId)
  return NextResponse.json({ runs })
}
