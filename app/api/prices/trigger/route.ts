import { NextResponse } from 'next/server'
import { checkAllTargetPrices } from '@/lib/prices'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// In-memory flag as primary TOCTOU guard; lock file persists intent across restarts
let _running = false

const LOCK_FILE = path.join(process.cwd(), 'data', 'price-check-lock.json')
const LOCK_TTL_MS = 30 * 60 * 1000 // 30 min — stale lock after this

function isRunning(): boolean {
  try {
    if (!fs.existsSync(LOCK_FILE)) return false
    const { startedAt } = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'))
    return Date.now() - new Date(startedAt).getTime() < LOCK_TTL_MS
  } catch {
    return false
  }
}

function acquireLock() {
  fs.mkdirSync(path.dirname(LOCK_FILE), { recursive: true })
  fs.writeFileSync(LOCK_FILE, JSON.stringify({ startedAt: new Date().toISOString() }))
}

function releaseLock() {
  try { fs.unlinkSync(LOCK_FILE) } catch { /* already gone */ }
}

export async function POST() {
  if (_running || isRunning()) {
    return NextResponse.json({ ok: true, message: 'Already running.' })
  }
  _running = true
  acquireLock()
  setImmediate(async () => {
    try { await checkAllTargetPrices() } catch (e) { console.error('[prices/trigger]', e) } finally { _running = false; releaseLock() }
  })
  return NextResponse.json({ ok: true, started: true })
}

export async function GET() {
  return NextResponse.json({ running: isRunning() })
}
