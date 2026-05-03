import type { UpgradeTarget, PriceRecord, PriceAlert } from '@/types'
import upgradePath from '@/data/upgrade-path.json'
import { savePriceRecord, getLatestPrices } from '@/lib/db'

interface SerperShoppingResult {
  title: string
  source: string
  link: string
  price: string
  currency?: string
  rating?: number
  reviews?: number
  imageUrl?: string
  position?: number
}

interface SerperResponse {
  shopping?: SerperShoppingResult[]
  error?: string
}

const KNOWN_STORES = ['kabum', 'pichau', 'terabyte']
const STORE_NAMES: Record<string, string> = {
  kabum: 'KaBuM',
  pichau: 'Pichau',
  terabyte: 'Terabyte Shop',
}

function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null
  const clean = priceStr.replace(/[^\d,\.]/g, '')
  const normalized = clean.replace(',', '.')
  const val = parseFloat(normalized)
  return isNaN(val) ? null : val
}

function detectStore(source: string, link: string): string | null {
  const combined = `${source} ${link}`.toLowerCase()
  for (const store of KNOWN_STORES) {
    if (combined.includes(store)) return store
  }
  return null
}

async function searchSerper(query: string): Promise<SerperShoppingResult[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    console.warn('[prices] SERPER_API_KEY not set — skipping price search')
    return []
  }

  try {
    const res = await fetch('https://google.serper.dev/shopping', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        gl: 'br',
        hl: 'pt-br',
        num: 20,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      console.error(`[prices] Serper API error: ${res.status}`)
      return []
    }

    const data = (await res.json()) as SerperResponse
    return data.shopping ?? []
  } catch (err) {
    console.error('[prices] Serper fetch failed:', err)
    return []
  }
}

async function fetchPricesForTarget(target: UpgradeTarget): Promise<PriceRecord[]> {
  const results = await searchSerper(target.searchQuery)
  const records: PriceRecord[] = []
  const now = new Date().toISOString()

  for (const item of results) {
    const store = detectStore(item.source, item.link)
    if (!store) continue
    const price = parsePrice(item.price)
    if (!price || price < 100) continue

    records.push({
      componentId: target.id,
      componentName: target.name,
      store: STORE_NAMES[store] ?? store,
      price,
      url: item.link,
      timestamp: now,
    })
  }

  // Deduplicate: keep lowest price per store
  const byStore = new Map<string, PriceRecord>()
  for (const r of records) {
    const existing = byStore.get(r.store)
    if (!existing || r.price < existing.price) byStore.set(r.store, r)
  }

  return Array.from(byStore.values())
}

export async function checkAllTargetPrices(): Promise<void> {
  const allTargets = [
    ...upgradePath.cpu.targets,
    ...upgradePath.gpu.targets,
    ...upgradePath.ram.targets,
    ...upgradePath.storage.targets,
  ] as UpgradeTarget[]

  console.log(`[prices] Checking ${allTargets.length} upgrade targets…`)

  for (const target of allTargets) {
    const records = await fetchPricesForTarget(target)
    for (const record of records) {
      savePriceRecord(record)
    }
    console.log(`[prices] ${target.name}: ${records.length} prices saved`)
    // Polite delay between searches to avoid rate limiting
    await new Promise((r) => setTimeout(r, 2000))
  }

  console.log('[prices] Price check complete.')
}

export function buildPriceAlerts(): PriceAlert[] {
  const allTargets = [
    ...upgradePath.cpu.targets,
    ...upgradePath.gpu.targets,
    ...upgradePath.ram.targets,
    ...upgradePath.storage.targets,
  ] as UpgradeTarget[]

  const latestPrices = getLatestPrices()
  const alerts: PriceAlert[] = []

  for (const target of allTargets) {
    const prices = latestPrices.filter((p) => p.componentId === target.id)
    if (prices.length === 0) continue

    const cheapest = prices.reduce((a, b) => (a.price < b.price ? a : b))
    const discountPercent = Math.round(
      ((target.estimatedPrice - cheapest.price) / target.estimatedPrice) * 100
    )
    const isBelowTrigger = cheapest.price <= target.triggerPrice

    if (discountPercent >= 10 || isBelowTrigger) {
      alerts.push({
        target,
        currentPrice: cheapest.price,
        store: cheapest.store,
        url: cheapest.url,
        discountPercent,
        isBelowTrigger,
      })
    }
  }

  return alerts.sort((a, b) => b.discountPercent - a.discountPercent)
}
