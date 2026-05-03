import fs from 'fs'
import path from 'path'
import type { HardwareSnapshot, PriceRecord, BuildEvent } from '@/types'

const DATA_DIR = path.join(process.cwd(), 'data')

function dbPath(name: string) {
  return path.join(DATA_DIR, `${name}.json`)
}

function readFile<T>(name: string, defaultVal: T): T {
  const p = dbPath(name)
  if (!fs.existsSync(p)) return defaultVal
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as T
  } catch {
    return defaultVal
  }
}

function writeFile<T>(name: string, data: T) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(dbPath(name), JSON.stringify(data, null, 2), 'utf-8')
}

// ─── Snapshots ──────────────────────────────────────────────────────────────

type StoredSnapshot = HardwareSnapshot & { id: number }

export function saveSnapshot(snapshot: Omit<HardwareSnapshot, 'id'>): number {
  const list = readFile<StoredSnapshot[]>('snapshots', [])
  const id = (list[0]?.id ?? 0) + 1
  const entry: StoredSnapshot = { ...snapshot, id }
  // Keep last 90 snapshots
  list.unshift(entry)
  writeFile('snapshots', list.slice(0, 90))
  return id
}

export function getLatestSnapshot(): HardwareSnapshot | null {
  const list = readFile<StoredSnapshot[]>('snapshots', [])
  return list[0] ?? null
}

export function getSnapshotHistory(limit = 30): HardwareSnapshot[] {
  const list = readFile<StoredSnapshot[]>('snapshots', [])
  return list.slice(0, limit)
}

// ─── Prices ─────────────────────────────────────────────────────────────────

type StoredPrice = PriceRecord & { id: number }

export function savePriceRecord(record: Omit<PriceRecord, 'id'>): number {
  const list = readFile<StoredPrice[]>('prices', [])
  const id = (list[0]?.id ?? 0) + 1
  const entry: StoredPrice = { ...record, id }
  list.unshift(entry)
  // Keep last 500 records
  writeFile('prices', list.slice(0, 500))
  return id
}

export function getLatestPrices(): PriceRecord[] {
  const list = readFile<StoredPrice[]>('prices', [])
  const seen = new Map<string, StoredPrice>()
  for (const r of list) {
    const key = `${r.componentId}::${r.store}`
    if (!seen.has(key)) seen.set(key, r)
  }
  return Array.from(seen.values())
}

export function getPriceHistory(componentId: string, days = 30): PriceRecord[] {
  const list = readFile<StoredPrice[]>('prices', [])
  const cutoff = Date.now() - days * 86400_000
  return list
    .filter(
      (r) => r.componentId === componentId && new Date(r.timestamp).getTime() >= cutoff
    )
    .reverse()
}

// ─── Build Events ────────────────────────────────────────────────────────────

type StoredEvent = BuildEvent & { id: number }

export function saveBuildEvent(event: Omit<BuildEvent, 'id'>): number {
  const list = readFile<StoredEvent[]>('events', [])
  const id = Math.max(0, ...list.map((e) => e.id)) + 1
  const entry: StoredEvent = { ...event, id }
  list.push(entry)
  list.sort((a, b) => b.date.localeCompare(a.date))
  writeFile('events', list)
  return id
}

export function getBuildEvents(): BuildEvent[] {
  return readFile<StoredEvent[]>('events', [])
}

export function seedBuildEvents(events: Omit<BuildEvent, 'id'>[]) {
  const existing = readFile<StoredEvent[]>('events', [])
  if (existing.length > 0) return
  for (const ev of events) saveBuildEvent(ev)
}
